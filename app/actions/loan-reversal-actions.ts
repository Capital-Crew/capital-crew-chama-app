'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { differenceInDays } from 'date-fns'

/**
 * Reverse a Loan Transaction
 * 
 * Implements Fineract-style reversal:
 * 1. Validates time limit (7 days)
 * 2. Soft Reversal: Marks LoanTransaction as reversed
 * 3. Hard Reversal: Posts Contra GL Entries
 * 4. Recalculation: Triggers TransactionReplayService
 */
export async function reverseLoanTransaction(transactionId: string, reason: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    if (!user || !['SYSTEM_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
        return { error: 'Permission Denied: Only Admins can reverse transactions' }
    }

    if (!reason || reason.length < 5) {
        return { error: 'Please provide a valid reason for reversal' }
    }

    try {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Fetch Original Transaction
            const originalTx = await tx.loanTransaction.findUnique({
                where: { id: transactionId },
                include: {
                    loan: {
                        include: { member: { include: { wallet: true } } }
                    }
                }
            })

            if (!originalTx) {
                throw new Error('Transaction not found')
            }

            if (originalTx.isReversed) {
                throw new Error('This transaction has already been reversed')
            }

            // 2. Validate Time Limit (7 Days)
            // Use transactionDate if available, fallback to postedAt
            const txDate = originalTx.transactionDate || originalTx.postedAt
            const daysSince = differenceInDays(new Date(), txDate)

            if (daysSince > 7) {
                throw new Error(`Reversal time limit exceeded. Transaction is ${daysSince} days old (Limit: 7 days).`)
            }

            // 3. Soft Reversal on LoanTransaction
            await tx.loanTransaction.update({
                where: { id: transactionId },
                data: {
                    isReversed: true,
                    reversedAt: new Date()
                }
            })

            // 4. Hard Reversal (GL - Contra Entries)
            // Strategy: Try to find the original GL entry and reverse it. 
            // If not found (legacy data), reconstruct the reversal manually.

            const linkedGlEntry = await tx.ledgerTransaction.findFirst({
                where: { externalReferenceId: transactionId }
            })

            if (linkedGlEntry) {
                // Smart Reversal: Reverse the actual original entry
                await AccountingEngine.reverseJournalEntry(
                    linkedGlEntry.id,
                    reason,
                    session.user.id!,
                    user.member?.name || 'Admin',
                    tx
                )
            } else {
                // Fallback: Manual Reconstruction
                // Determine mappings based on transaction type
                const mappings = await getSystemMappingsDict()
                const journalLines: any[] = []

                // Reconstruct amounts
                const amount = Number(originalTx.amount)
                const principal = Number(originalTx.principalAmount)
                const interest = Number(originalTx.interestAmount)
                const penalty = Number(originalTx.penaltyAmount)
                const fees = Number(originalTx.feeAmount)

                // Logic depends on type. 
                // REPAYMENT: Was DR Wallet / CR Receivables. 
                // REVERSAL: DR Receivables / CR Wallet.

                if (originalTx.type === 'REPAYMENT') {
                    // DR Receivables (Restore Asset)
                    if (principal > 0) journalLines.push({ accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, debitAmount: principal, creditAmount: 0, description: `Reversal: Principal` })
                    if (interest > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_INTEREST, debitAmount: interest, creditAmount: 0, description: `Reversal: Interest` })
                    if (penalty > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_PENALTY, debitAmount: penalty, creditAmount: 0, description: `Reversal: Penalty` })
                    if (fees > 0 && mappings.RECEIVABLE_LOAN_FEES) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_FEES, debitAmount: fees, creditAmount: 0, description: `Reversal: Fees` })

                    // CR Wallet (Return money to member)
                    if (originalTx.loan.member.wallet) {
                        journalLines.push({
                            accountId: originalTx.loan.member.wallet.glAccountId,
                            debitAmount: 0,
                            creditAmount: amount,
                            description: `Reversal: Refund to Wallet`
                        })
                    }
                } else if (originalTx.type === 'DISBURSEMENT') {
                    // Disbursement: Was DR Portfolio / CR Wallet
                    // Reversal: DR Wallet / CR Portfolio
                    if (originalTx.loan.member.wallet) {
                        journalLines.push({
                            accountId: originalTx.loan.member.wallet.glAccountId,
                            debitAmount: amount,
                            creditAmount: 0,
                            description: `Reversal: Return Disbursement`
                        })
                    }
                    // CR Portfolio
                    journalLines.push({ accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, debitAmount: 0, creditAmount: amount, description: `Reversal: Cancel Disbursement` })
                }

                // Add other types as needed (PENALTY, WAIVER etc.)

                // Post GL Reversal
                if (journalLines.length > 0) {
                    await AccountingEngine.postJournalEntry({
                        transactionDate: new Date(),
                        referenceType: 'REVERSAL',
                        referenceId: originalTx.id,
                        description: `Reversal of ${originalTx.type} ${originalTx.id.substring(0, 8)}`,
                        notes: reason,
                        lines: journalLines,
                        createdBy: session.user.id!,
                        createdByName: user.member?.name || 'Admin',
                    }, tx)
                }
            }

            // 4b. Create Explicit Reversal Transaction (Contra-Entry)
            await tx.loanTransaction.create({
                data: {
                    loanId: originalTx.loanId,
                    type: 'REVERSAL',
                    amount: originalTx.amount, // Positive amount
                    principalAmount: originalTx.principalAmount,
                    interestAmount: originalTx.interestAmount,
                    penaltyAmount: originalTx.penaltyAmount,
                    feeAmount: originalTx.feeAmount,
                    description: `Reversal: ${originalTx.type} (${reason})`,
                    referenceId: originalTx.id, // Link to original
                    postedAt: new Date(),
                    transactionDate: new Date(),
                    isReversed: false // The reversal itself is valid
                }
            })

            // 5. Recalculate Schedule (The "Magic" Step)
            // This rebuilds the installlment state based on the remaining valid transactions
            // Pass 'tx' to ensure atomic transaction and visibility of the reversal
            await TransactionReplayService.replayTransactions(originalTx.loanId, undefined, tx)

            // 6. Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'WALLET_TRANSACTION_REVERSED',
                    details: `Reversed transaction ${originalTx.id} (Type: ${originalTx.type}) - ${reason}`
                }
            })

            revalidatePath(`/loans/${originalTx.loanId}`)
            revalidatePath('/loans')
            revalidatePath(`/members/${originalTx.loan.memberId}`)

            return { success: true }
        }, {
            maxWait: 5000,
            timeout: 20000
        })
    } catch (e: any) {
        console.error('Reversal Error', e)
        return { error: e.message || 'Failed to reverse transaction' }
    }
}
