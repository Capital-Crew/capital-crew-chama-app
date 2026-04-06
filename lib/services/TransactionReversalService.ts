import { db } from '@/lib/db'
import { Prisma, ExpenseStatus } from '@prisma/client'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { differenceInDays } from 'date-fns'
import { TransactionReplayService } from './TransactionReplayService'
import { revalidatePath } from 'next/cache'

export type ReversalType = 'LOAN' | 'SAVINGS' | 'SHARE' | 'EXPENSE'
export const REVERSAL_WINDOW_DAYS = 30

export class TransactionReversalService {

    /**
     * Universal Transaction Reversal
     * 
     * Reverses ANY financial transaction while maintaining strict accounting integrity.
     * 
     * @param refId - The ID of the transaction to reverse (LoanTransaction.id, WalletTransaction.id, etc.)
     * @param type - The context type (LOAN, SAVINGS, SHARE, EXPENSE)
     * @param reason - Reason for reversal
     * @param adminId - ID of the admin performing the action
     */
    static async reverseTransaction(
        refId: string,
        type: ReversalType,
        reason: string,
        adminId: string
    ) {


        // Time Limit Check (Centralized)

        try {
            return await db.$transaction(async (tx) => {
                let transactionDate: Date
                let memberId: string | null = null

                // --- Step 2: Context-Specific Fetch & Validation ---
                switch (type) {
                    case 'LOAN':
                        const loanTx = await tx.loanTransaction.findUnique({
                            where: { id: refId },
                            include: { loan: true }
                        })
                        if (!loanTx) throw new Error('Loan Transaction not found')
                        if (loanTx.isReversed) throw new Error('Transaction already reversed')

                        transactionDate = loanTx.postedAt
                        memberId = loanTx.loan.memberId

                        // Validation: Basic Reversal Rules
                        if (differenceInDays(new Date(), transactionDate) > REVERSAL_WINDOW_DAYS) {
                            throw new Error(`Reversal window expired (${REVERSAL_WINDOW_DAYS} days)`)
                        }

                        // Update State
                        await tx.loanTransaction.update({
                            where: { id: refId },
                            data: {
                                isReversed: true,
                                reversedAt: new Date(),
                                description: `${loanTx.description} [REVERSED]`
                            }
                        })

                        // Create Contra-Transaction (Optional, but good for Statement visibility)
                        // Note: Some systems just mark isReversed. Here we create an explicit REVERSAL record for the statement.
                        await tx.loanTransaction.create({
                            data: {
                                loanId: loanTx.loanId,
                                type: 'REVERSAL',
                                amount: loanTx.amount,
                                description: `Reversal: ${loanTx.type} - ${reason}`,
                                postedAt: new Date(),
                                transactionDate: new Date(),
                                principalAmount: loanTx.principalAmount,
                                interestAmount: loanTx.interestAmount,
                                penaltyAmount: loanTx.penaltyAmount,
                                feeAmount: loanTx.feeAmount,
                                referenceId: loanTx.id
                            }
                        })

                        break

                    case 'SAVINGS':
                        const walletTx = await tx.walletTransaction.findUnique({
                            where: { id: refId },
                            include: { wallet: true }
                        })
                        if (!walletTx) throw new Error('Wallet Transaction not found')
                        // Check if already reversed (using boolean or relation)
                        if (walletTx.isReversed) throw new Error('Transaction already reversed')

                        transactionDate = walletTx.createdAt
                        memberId = walletTx.wallet.memberId

                        if (differenceInDays(new Date(), transactionDate) > REVERSAL_WINDOW_DAYS) {
                            throw new Error('Reversal window expired')
                        }

                        // Validation: Min Balance Check (If reversing a DEPOSIT, we are taking money OUT)
                        if (walletTx.type === 'DEPOSIT' || walletTx.type === 'CONTRIBUTION') {
                            // Check if wallet has enough funds to cover the reversal
                            const currentBalance = await getMemberWalletBalance(memberId, tx)
                            if (currentBalance < Number(walletTx.amount)) {
                                throw new Error('Insufficient wallet balance to reverse this deposit.')
                            }
                        }

                        // Update State
                        await tx.walletTransaction.update({
                            where: { id: refId },
                            data: {
                                isReversed: true,
                                description: `${walletTx.description} [REVERSED]`
                            }
                        })

                        // Create explicit Reversal Transaction in Wallet
                        // P3.2: Compute real balance after reversal
                        const postReversalBalance = await getMemberWalletBalance(memberId!, tx)
                        await tx.walletTransaction.create({
                            data: {
                                walletId: walletTx.walletId,
                                type: 'REVERSAL',
                                amount: walletTx.amount,
                                description: `Reversal of ${walletTx.type} - ${reason}`,
                                balanceAfter: postReversalBalance,
                                reverses: walletTx.id
                            }
                        })

                        // --- CASCADING REVERSAL: Check for Related Loan ---
                        if (walletTx.relatedLoanId) {

                            const loanTx = await tx.loanTransaction.findFirst({
                                where: {
                                    loanId: walletTx.relatedLoanId,
                                    referenceId: walletTx.id,  // Direct FK
                                    isReversed: false,
                                }
                            })


                            if (loanTx) {
                                // 2. Reverse the Loan Transaction
                                await tx.loanTransaction.update({
                                    where: { id: loanTx.id },
                                    data: {
                                        isReversed: true,
                                        reversedAt: new Date(),
                                        description: `${loanTx.description} [REVERSED]`
                                    }
                                })
                                // 3. Create Correction
                                await tx.loanTransaction.create({
                                    data: {
                                        loanId: loanTx.loanId,
                                        type: 'REVERSAL',
                                        amount: loanTx.amount,
                                        description: `Reversal: Linked Repayment - ${reason}`,
                                        postedAt: new Date(),
                                        transactionDate: new Date(),
                                        referenceId: loanTx.id
                                    }
                                })
                                // 4. Trigger Schedule Recalculation
                                await TransactionReplayService.replayTransactions(loanTx.loanId, undefined, tx)
                                try {
                                    revalidatePath(`/loans/${loanTx.loanId}`)
                                } catch (e) {
                                }
                            }
                        }
                        break

                    case 'SHARE':
                        const shareTx = await tx.shareTransaction.findUnique({
                            where: { id: refId }
                        })
                        if (!shareTx) throw new Error('Share Transaction not found')
                        if (shareTx.isReversed) throw new Error('Transaction already reversed')

                        transactionDate = shareTx.createdAt
                        memberId = shareTx.memberId

                        if (differenceInDays(new Date(), transactionDate) > REVERSAL_WINDOW_DAYS) {
                            throw new Error('Reversal window expired')
                        }

                        // Update State
                        await tx.shareTransaction.update({
                            where: { id: refId },
                            data: { isReversed: true }
                        })

                        // P4.3: Look up real admin name instead of hardcoding 'Admin'
                        const adminUser = await tx.user.findUnique({ where: { id: adminId }, select: { name: true } })
                        await tx.shareTransaction.create({
                            data: {
                                memberId: shareTx.memberId,
                                type: 'REVERSAL',
                                amount: shareTx.amount,
                                description: `Reversal of Share purchase - ${reason}`,
                                createdBy: adminId,
                                creatorName: adminUser?.name || 'Admin',
                                reverses: shareTx.id
                            }
                        })

                        break

                    case 'EXPENSE':
                        const expense = await tx.expense.findUnique({
                            where: { id: refId }
                        })
                        if (!expense) throw new Error('Expense not found')
                        if (expense.status === 'REVERSED' || expense.status === 'REJECTED') {
                            throw new Error('Expense already reversed or rejected')
                        }
                        // Only allow reversing DISBURSED or CLOSED or SURRENDERED
                        if (!['DISBURSED', 'CLOSED', 'SURRENDERED'].includes(expense.status)) {
                            throw new Error(`Cannot reverse expense in status ${expense.status}`)
                        }

                        // Check period (budget check - simplified for now)

                        transactionDate = expense.date // or updatedAt?
                        // Expenses might be older, maybe relax rule or use updated date?
                        // Stick to 7 days from Disbursed date (updatedAt usually) for now.
                        if (differenceInDays(new Date(), expense.updatedAt) > REVERSAL_WINDOW_DAYS) {
                            throw new Error('Reversal window expired')
                        }

                        // Update Status
                        await tx.expense.update({
                            where: { id: refId },
                            data: { status: 'REVERSED' } // Valid after schema update
                        })

                        break
                }


                const journalEntry = await tx.ledgerTransaction.findFirst({
                    where: {
                        referenceId: refId,
                        isReversed: false
                    }
                })

                if (journalEntry) {
                    await AccountingEngine.reverseJournalEntry(
                        journalEntry.id,
                        reason,
                        adminId,
                        'System Admin', // Todo: fetch name
                        tx
                    )
                } else {
                    // This might be valid for legacy data or drafts, but ideally we should have one.
                }





                // EXPENSE:
                // - DISBURSEMENT (to Member): User Wallet +100. Reversal: User Wallet -100.


                // - Original Withdrawal: DR Member Wallet.
                // - Reversal: CR Member Wallet. -> Balance increases. Correct.

                // So, explicitly "moving money" via WalletTransaction creation is needed ONLY for the record keeping in the Wallet Statement (which we did inside the Switch case).
                // The ACTUAL balance update happens via `AccountingEngine.reverseJournalEntry`.

                // Therefore, strict "Wallet Movement" step is covered by Step 2 (Creating Reversal Tx) and Step 3 (GL Reversal).


                // --- Step 5: Audit Log ---
                await tx.reversalLog.create({
                    data: {
                        targetType: type,
                        targetId: refId,
                        reason,
                        adminId,
                        timestamp: new Date()
                    }
                })

                // Also standard audit log
                await tx.auditLog.create({
                    data: {
                        userId: adminId,
                        action: 'JOURNAL_REVERSAL',
                        details: `Reversed ${type} ${refId}: ${reason}`
                    }
                })


                // --- Step 6: Post-Action Triggers ---
                if (type === 'LOAN') {
                    // Fetch loanId again if needed
                    const loanTx = await tx.loanTransaction.findUnique({ where: { id: refId } })
                    if (loanTx) {
                        await TransactionReplayService.replayTransactions(loanTx.loanId, undefined, tx)
                        try {
                            revalidatePath(`/loans/${loanTx.loanId}`)
                        } catch (e) { }
                    }
                }

                if (memberId) {
                    try {
                        revalidatePath(`/members/${memberId}`)
                    } catch (e) { }
                }

                return { success: true }
            }, {
                maxWait: 5000,
                timeout: 20000
            })
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }
}
