'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'
import { AccountingEngine, getLoanPrincipalBalance, getLoanInterestBalance, getLoanPenaltyBalance } from '@/lib/accounting/AccountingEngine'
import { PostingRules } from '@/lib/accounting/PostingRules'
import { LoanBalanceService } from '@/services/loan-balance';

// Use global db instance
const prisma = db

/**
 * Repay a loan
 * Allocates payment in order: Penalty → Interest → Principal
 * Uses accounting engine for double-entry posting
 */
export async function repayLoan(loanId: string, amount: number) {
    const session = await auth()

    if (!session?.user) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    if (!user?.member) {
        throw new Error('No member associated with this user')
    }

    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
            member: {
                include: { wallet: true }
            },
            loanProduct: true
        }
    })

    if (!loan) {
        throw new Error('Loan not found')
    }

    if (loan.status !== 'DISBURSED' && loan.status !== 'ACTIVE') {
        throw new Error('Loan is not active')
    }

    if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0')
    }

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Get outstanding balances from General Ledger (source of truth)
        const outstandingPenalty = await getLoanPenaltyBalance(loanId)
        const outstandingInterest = await getLoanInterestBalance(loanId)
        const outstandingPrincipal = await getLoanPrincipalBalance(loanId)

        const totalOutstanding = outstandingPenalty + outstandingInterest + outstandingPrincipal

        if (amount > totalOutstanding + 0.01) { // Allow tiny epsilon for floating point
            throw new Error(`Payment amount (${amount.toLocaleString()}) exceeds total outstanding balance (${totalOutstanding.toLocaleString()}). Please adjust the amount.`)
        }

        // Allocate payment: Penalty → Interest → Principal
        let remaining = amount
        const allocation = {
            penalty: 0,
            interest: 0,
            principal: 0
        }

        // 1. Penalty first
        if (outstandingPenalty > 0) {
            allocation.penalty = Math.min(remaining, outstandingPenalty)
            remaining -= allocation.penalty
        }

        // 2. Interest second
        if (remaining > 0 && outstandingInterest > 0) {
            allocation.interest = Math.min(remaining, outstandingInterest)
            remaining -= allocation.interest
        }

        // 3. Principal last
        if (remaining > 0) {
            allocation.principal = Math.min(remaining, outstandingPrincipal)
        }

        // Fetch mappings
        const { getSystemMappingsDict } = await import('@/app/actions/system-accounting');
        const mappings = await getSystemMappingsDict();

        // Postal journal entry via accounting engine
        const journalEntry = await AccountingEngine.postJournalEntry(
            PostingRules.loanRepayment(
                {
                    id: loan.id,
                    loanApplicationNumber: loan.loanApplicationNumber,
                    memberId: loan.memberId
                },
                allocation,
                mappings,
                new Date(),
                session.user.id!,
                user.member!.name
            ),
            tx
        )

        // NEW: Create Strict Loan Ledger Transaction
        await tx.loanTransaction.create({
            data: {
                loanId: loan.id,
                type: 'REPAYMENT', // Matches enum LoanTransactionType
                amount: new Prisma.Decimal(amount),
                description: `Repayment received (Ref: ${journalEntry.id})`,
                referenceId: journalEntry.id,
                postedAt: new Date()
            }
        });

        // NEW: FORCE Strict Balance Recalculation
        const verifiedBalance = await LoanBalanceService.updateLoanBalance(loanId, tx);

        // Create wallet transaction (legacy compatibility)
        await tx.walletTransaction.create({
            data: {
                walletId: loan.member.wallet!.id,
                type: 'REPAYMENT',
                amount: amount,
                description: `Loan repayment: ${loan.loanApplicationNumber}`,
                relatedLoanId: loan.id,
                balanceAfter: 0, // Will be calculated from ledger
                immutable: true
            }
        })

        // Check if loan is now fully paid based on STRICT balance
        const isFullyPaid = verifiedBalance.toNumber() <= 0.01;

        if (isFullyPaid) {
            // Loan is fully paid!
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'CLEARED'
                }
            })

            // Journey event - loan cleared
            await tx.loanJourneyEvent.create({
                data: {
                    loanId: loan.id,
                    eventType: 'LOAN_CLEARED',
                    description: `Loan fully repaid. Final Balance: ${verifiedBalance.toString()}`,
                    actorId: session.user.id,
                    actorName: user.member!.name,
                    metadata: {
                        finalPayment: amount,
                        allocation,
                        journalEntryId: journalEntry.id
                    }
                }
            })

            // Notification
            await tx.notification.create({
                data: {
                    memberId: loan.memberId,
                    type: 'LOAN_APPROVED',
                    message: `Congratulations! Your loan ${loan.loanApplicationNumber} is now fully paid off!`,
                    loanId: loan.id
                }
            })
        } else {
            // Partial payment
            await tx.loanJourneyEvent.create({
                data: {
                    loanId: loan.id,
                    eventType: 'REPAYMENT_MADE',
                    description: `Payment of KES ${amount.toLocaleString()} received. Balance: ${verifiedBalance.toString()}`,
                    actorId: session.user.id,
                    actorName: user.member!.name,
                    metadata: {
                        paymentAmount: amount,
                        allocation,
                        remainingPrincipal: outstandingPrincipal - allocation.principal,
                        remainingInterest: outstandingInterest - allocation.interest,
                        remainingPenalty: outstandingPenalty - allocation.penalty,
                        journalEntryId: journalEntry.id
                    }
                }
            })
        }

        // Audit log
        await tx.auditLog.create({
            data: {
                userId: session.user.id!,
                action: 'LOAN_DISBURSED',
                details: `Repayment of KES ${amount} for loan ${loan.loanApplicationNumber}. New Balance: ${verifiedBalance.toString()}`
            }
        })

        revalidatePath('/loans')
        revalidatePath('/dashboard')
        revalidatePath(`/members/${loan.memberId}`)
        revalidatePath(`/loans/${loanId}`)

        return {
            success: true,
            allocation,
            journalEntryId: journalEntry.id,
            loanCleared: isFullyPaid,
            remainingBalance: verifiedBalance.toNumber()
        }
    })
}
