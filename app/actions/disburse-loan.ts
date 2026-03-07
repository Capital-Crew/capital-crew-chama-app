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

export async function disburseLoan(loanId: string) {
    const session = await auth()

    if (!session?.user) {
        throw new Error("Unauthorized: Please log in to continue")
    }

    // 1. Fetch Loan to verify ownership
    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        select: { memberId: true, loanApplicationNumber: true }
    })

    if (!loan) {
        throw new Error("Loan not found")
    }

    // 2. Authorization Logic:
    // - Owner (initiator) can disburse their own loan
    // - System Admin & Chairperson can disburse on behalf of member
    // - Treasurer/Secretary are excluded from this specific step (strict requirement)
    const isOwner = session.user.memberId === loan.memberId
    const isPowerAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)

    if (!isOwner && !isPowerAdmin) {
        throw new Error("Unauthorized: Only the loan initiator or a senior administrator can disburse this loan")
    }

    try {
        const result = await LoanService.disburseLoan(
            loanId,
            session.user.id!,
            session.user.name || 'Admin'
        )

        revalidatePath(`/loans/${loanId}`)
        revalidatePath('/dashboard')
        revalidatePath('/accounts')
        revalidatePath('/wallet')

        return result
    } catch (error: any) {
        return { error: error.message || "Failed to disburse loan" }
    }
}

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
