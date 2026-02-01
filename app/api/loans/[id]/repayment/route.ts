import { NextRequest, NextResponse } from 'next/server'
import { RepaymentProcessorService } from '@/lib/services/RepaymentProcessorService'
import { LoanStateService } from '@/lib/services/LoanStateService'
import { OverpaymentHandlerService } from '@/lib/services/OverpaymentHandlerService'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const RepaymentSchema = z.object({
    amount: z.number().positive('Amount must be greater than zero'),
    paymentDate: z.string().optional(),
    description: z.string().optional(),
    reference: z.string().optional()
})

/**
 * POST /api/loans/[id]/repayment
 * 
 * Process a loan repayment using Waterfall allocation
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: loanId } = await params
        const body = await request.json()

        // Validate input
        const validation = RepaymentSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid input',
                    details: validation.error.issues
                },
                { status: 400 }
            )
        }

        const { amount, paymentDate, description, reference } = validation.data

        // Verify loan exists and is active
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            select: { id: true, status: true, memberId: true }
        })

        if (!loan) {
            return NextResponse.json(
                { error: 'Loan not found' },
                { status: 404 }
            )
        }

        if (!['ACTIVE', 'OVERDUE'].includes(loan.status)) {
            return NextResponse.json(
                { error: `Cannot process payment for loan with status: ${loan.status}` },
                { status: 400 }
            )
        }

        // Process the repayment
        const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date()
        const paymentDescription = description || `Loan Repayment${reference ? ` - ${reference}` : ''}`

        const result = await RepaymentProcessorService.processRepayment(
            loanId,
            amount,
            paymentDateObj,
            paymentDescription
        )

        // Update loan status
        const statusUpdate = await LoanStateService.updateLoanStatus(loanId)

        // Check for overpayment and apply to future principal
        const overpaymentCheck = await OverpaymentHandlerService.detectOverpayment(loanId)
        let overpaymentHandled = false

        if (overpaymentCheck.hasOverpayment && overpaymentCheck.overpaymentAmount > 0) {
            await OverpaymentHandlerService.applyToFuturePrincipal(
                loanId,
                overpaymentCheck.overpaymentAmount
            )
            overpaymentHandled = true
        }

        return NextResponse.json({
            success: true,
            data: {
                transaction: {
                    id: result.transaction.id,
                    amount: amount,
                    postedAt: result.transaction.postedAt
                },
                allocation: result.allocation,
                loanStatus: {
                    previous: statusUpdate.previousStatus,
                    current: statusUpdate.newStatus,
                    changed: statusUpdate.statusChanged
                },
                overpayment: overpaymentHandled ? {
                    amount: overpaymentCheck.overpaymentAmount,
                    appliedToFuturePrincipal: true
                } : null
            }
        })

    } catch (error: any) {
        console.error('Error processing repayment:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to process repayment'
            },
            { status: 500 }
        )
    }
}
