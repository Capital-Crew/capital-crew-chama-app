import { NextRequest, NextResponse } from 'next/server'
import { LoanBalanceService } from '@/lib/services/LoanBalanceService'
import { db } from '@/lib/db'

/**
 * GET /api/loans/[id]/balance
 * 
 * Returns comprehensive balance breakdown for a loan
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: loanId } = await params

        // Verify loan exists
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            select: { id: true, status: true }
        })

        if (!loan) {
            return NextResponse.json(
                { error: 'Loan not found' },
                { status: 404 }
            )
        }

        // Get balance breakdown
        const balance = await LoanBalanceService.getLoanBalance(loanId)

        return NextResponse.json({
            success: true,
            data: balance
        })

    } catch (error: any) {

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch loan balance'
            },
            { status: 500 }
        )
    }
}
