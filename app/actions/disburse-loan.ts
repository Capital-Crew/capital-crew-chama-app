'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, LoanStatus, LoanEventType, NotificationType, AuditLogAction, SystemAccountType, LoanTransactionType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { LoanBalanceService } from '@/services/loan-balance'
import { WalletService } from '@/lib/services/WalletService'
import { getSystemMappingsDict } from './system-accounting'
import { RepaymentCalculator } from '@/lib/utils/repayment-calculator'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'

const prisma = db

/**
 * Disburse a loan (Post Loan)
 * This action credits the member wallet and generates the repayment schedule.
 */
import { LoanService } from '@/services/loan-service'
import { withAudit } from '@/lib/with-audit'

export const disburseLoan = withAudit(
    { actionType: AuditLogAction.LOAN_DISBURSED, domain: 'LOAN', apiRoute: '/api/loans/disburse' },
    async (ctx, loanId: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error("Unauthorized: Please log in to continue")
        }

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            select: { memberId: true, loanApplicationNumber: true, status: true, amount: true }
        })

        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error("Loan not found")
        }
        ctx.captureBefore('Loan', loanId, loan);

        const isOwner = session.user.memberId === loan.memberId
        const isPowerAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)

        if (!isOwner && !isPowerAdmin) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error("Unauthorized: Only the loan initiator or a senior administrator can disburse this loan")
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Execute Disbursement Service');
            const result = await LoanService.disburseLoan(
                loanId,
                session.user.id!,
                session.user.name || 'Admin'
            )
            ctx.endStep('Execute Disbursement Service', { result });

            const updatedLoan = await prisma.loan.findUnique({
                where: { id: loanId },
                select: { id: true, status: true, disbursedAt: true }
            });
            if (updatedLoan) ctx.captureAfter(updatedLoan);

            revalidatePath(`/loans/${loanId}`)
            revalidatePath('/dashboard')
            revalidatePath('/accounts')
            revalidatePath('/wallet')

            return result
        } catch (error: any) {
            ctx.setErrorCode('DISBURSEMENT_FAILED');
            return { error: error.message || "Failed to disburse loan" }
        }
    }
);

/**
 * Process Loan Offsets (Refinancing)
 * 
 * Executes the Sub-Ledger transactions to clear old loans.
 * CRITICAL: Separates the Balance Clearance from the Refinance Fee.
 * 
 * - Old Loan: Credited with Clearance Amount ONLY (Principal + Interest + Penalties).
 * - Refinance Fee: Handled in GL (Income), NOT placed on the Old Loan ledger.
 */
async function processLoanOffset(topUps: any[], newLoanNumber: string, tx: Prisma.TransactionClient) {
    for (const topUp of topUps) {
        // Calculate the actual Clearance Amount (Total Offset - Fee)
        // This ensures the Old Loan balance goes up to exactly 0, not negative

        // Handle Decimal conversion safely
        const totalOffset = new Prisma.Decimal(topUp.totalOffset)
        const refinanceFee = new Prisma.Decimal(topUp.refinanceFee || 0)

        // Clearance Amount = The Debt we are wiping out
        const clearanceAmount = totalOffset.sub(refinanceFee)

        if (clearanceAmount.gt(0)) {
            // Record repayment on old loan (Sub-Ledger)
            await tx.loanTransaction.create({
                data: {
                    loanId: topUp.oldLoanId,
                    type: 'REPAYMENT', // Reduces Balance
                    amount: clearanceAmount, // ONLY the debt amount
                    description: `Refinance Clearance via ${newLoanNumber}`,
                    postedAt: new Date()
                }
            })

            // Force Update old loan balance
            const verifiedBalance = await LoanBalanceService.updateLoanBalance(topUp.oldLoanId, tx)

            // Close the loan if fully paid (tolerant to tiny precision errors)
            if (verifiedBalance.lte(0.01)) {
                await tx.loan.update({
                    where: { id: topUp.oldLoanId },
                    data: {
                        status: 'CLEARED',
                        outstandingBalance: new Prisma.Decimal(0)
                    }
                })

                // Optional: Log closure event
                await tx.loanJourneyEvent.create({
                    data: {
                        loanId: topUp.oldLoanId,
                        eventType: 'LOAN_CLEARED',
                        description: `Loan cleared via refinance (Offset by ${newLoanNumber})`,
                        actorId: 'SYSTEM',
                        actorName: 'System'
                    }
                })
            }
        }
    }
}
