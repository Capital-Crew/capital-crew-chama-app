'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getNextLoanNumber } from '@/lib/utils'
import { z } from 'zod'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction, LoanStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Zod schema for Direct Loan Loading.
 * This bypasses the typical application flow.
 */
const directLoanLoaderSchema = z.object({
    memberId: z.string().min(1, "Member is required"),
    loanProductId: z.string().min(1, "Loan Product is required"),
    amount: z.number().positive("Amount must be positive"),
    installments: z.number().int().positive().max(360, "Max 360 installments"),
    disbursementDate: z.string().min(1, "Disbursement date is required"),
    purpose: z.string().optional().default("Back-loaded existing loan"),
})

export const directLoadLoan = withAudit(
    { actionType: AuditLogAction.LOAN_DISBURSED, domain: 'LOAN', apiRoute: '/api/admin/loans/direct-load' },
    async (ctx, data: unknown) => {
        ctx.beginStep('Validate Admin Session');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        // Check if user is Admin or Chairperson
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(user?.role || '')) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error('Forbidden: Only administrators can use this tool.')
        }
        ctx.endStep('Validate Admin Session');

        ctx.beginStep('Parse Payload');
        const result = directLoanLoaderSchema.safeParse(data)
        if (!result.success) {
            ctx.setErrorCode('INVALID_PAYLOAD');
            throw new Error('Invalid data: ' + result.error.issues[0].message)
        }
        const { memberId, loanProductId, amount, installments, disbursementDate, purpose } = result.data
        ctx.endStep('Parse Payload');

        ctx.beginStep('Validate Entities');
        const [member, product] = await Promise.all([
            db.member.findUnique({ where: { id: memberId } }),
            db.loanProduct.findUnique({ where: { id: loanProductId } })
        ])

        if (!member) throw new Error('Member not found')
        if (!product) throw new Error('Loan Product not found')
        ctx.endStep('Validate Entities');

        ctx.beginStep('Atomic Loan Injection');
        try {
            // 1. Generate Loan Number
            const lastLoan = await db.loan.findFirst({
                orderBy: { loanApplicationNumber: 'desc' },
                select: { loanApplicationNumber: true }
            })
            const nextNumber = getNextLoanNumber(lastLoan?.loanApplicationNumber)

            // 2. Perform everything in a transaction
            const loan = await db.$transaction(async (tx) => {
                const newLoan = await tx.loan.create({
                    data: {
                        loanApplicationNumber: nextNumber,
                        memberId,
                        loanProductId,
                        amount,
                        installments,
                        disbursementDate: new Date(disbursementDate),
                        applicationDate: new Date(disbursementDate), // Assume applied same day
                        purpose,
                        status: 'DISBURSED', // Direct loading as Disbursed
                        current_balance: amount,
                        outstandingBalance: amount,
                        interestRate: product.interestRate,
                        dueDate: new Date(new Date(disbursementDate).setMonth(new Date(disbursementDate).getMonth() + installments)),
                        
                        // Metadata for tracking
                        notes: `Directly loaded by ${session.user.name}`
                    }
                })

                // 3. Create initial Disbursement Transaction in Loan Ledger
                await tx.loanTransaction.create({
                    data: {
                        loanId: newLoan.id,
                        type: 'DISBURSEMENT',
                        amount,
                        principalAmount: amount,
                        description: `Initial disbursement for pre-approved loan ${nextNumber}`,
                        transactionDate: new Date(disbursementDate),
                        postedAt: new Date(),
                    }
                })

                // 4. Create Ledger Transactions (Optional but recommended for consistency)
                // Note: Simplified for this tool. Real implementation might need mapping lookups.
                
                return newLoan
            })

            ctx.captureAfter(loan);
            ctx.endStep('Atomic Loan Injection', { loanId: loan.id });
            
            revalidatePath('/loans')
            return { success: true, loanId: loan.id, loanNumber: loan.loanApplicationNumber }
        } catch (error: any) {
            ctx.setErrorCode('TRANSACTION_FAILED');
            ctx.failStep('Atomic Loan Injection', error);
            throw new Error(`Failed to load loan: ${error.message}`)
        }
    }
)
