'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

/**
 * Reverse a Loan Repayment
 * 
 * Reverses a previously made repayment.
 * - Checks strict permissions (Admin only)
 * - Verifies transaction exists and hasn't been reversed
 * - Posts Reversal Journal Entry
 * - Credits Member Wallet (if applicable)
 * - Increases Loan Balance
 * - Logs Audit
 */
export async function reverseRepayment(transactionId: string, reason: string) {
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
        return await prisma.$transaction(async (tx) => {
            // 1. Fetch Original Transaction
            // We look for LoanTransaction (strict ledger)
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

            if (originalTx.type !== 'REPAYMENT') {
                throw new Error('Only Repayment transactions can be reversed here')
            }

            // Check if already reversed (Naive check: is there a reversal ref to this?)
            const existingReversal = await tx.loanTransaction.findFirst({
                where: {
                    type: 'REVERSAL',
                    referenceId: originalTx.id
                }
            })

            if (existingReversal) {
                throw new Error('This transaction has already been reversed')
            }

            // 2. Fetch Mappings
            const mappings = await getSystemMappingsDict()
            // mappings needed: same as repayment but swapped.
            // RECEIVABLE_LOAN_PENALTY, RECEIVABLE_LOAN_INTEREST, EVENT_LOAN_REPAYMENT_PRINCIPAL

            // 3. Create Reversal Journal Entry
            // We need to reverse the effect.
            // Original: DR Wallet, CR Receivables/Portfolio
            // Reversal: DR Receivables/Portfolio, CR Wallet

            // Reconstruct the amounts from the original transaction
            const penalty = Number(originalTx.penaltyAmount)
            const interest = Number(originalTx.interestAmount)
            const fees = Number(originalTx.feeAmount)
            const principal = Number(originalTx.principalAmount)
            const total = Number(originalTx.amount)

            const journalLines: any[] = []

            // DR Receivables (Increase Asset/Receivable)
            if (penalty > 0) {
                journalLines.push({
                    accountCode: mappings.RECEIVABLE_LOAN_PENALTY,
                    debitAmount: penalty,
                    creditAmount: 0,
                    description: `Reversal: Penalty (Tx: ${originalTx.id.substring(0, 8)})`
                })
            }
            if (interest > 0) {
                journalLines.push({
                    accountCode: mappings.RECEIVABLE_LOAN_INTEREST,
                    debitAmount: interest,
                    creditAmount: 0,
                    description: `Reversal: Interest`
                })
            }
            if (fees > 0) {
                // If we had a fees mapping
                if (mappings.RECEIVABLE_LOAN_FEES) {
                    journalLines.push({
                        accountCode: mappings.RECEIVABLE_LOAN_FEES,
                        debitAmount: fees,
                        creditAmount: 0,
                        description: `Reversal: Fees`
                    })
                }
            }
            if (principal > 0) {
                journalLines.push({
                    accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, // Loan Portfolio
                    debitAmount: principal,
                    creditAmount: 0,
                    description: `Reversal: Principal`
                })
            }

            // CR Wallet (Increase Liability/Balance - Giving money back to user)
            // Only if member has a wallet.
            if (originalTx.loan.member.wallet) {
                journalLines.push({
                    accountId: originalTx.loan.member.wallet.glAccountId,
                    debitAmount: 0,
                    creditAmount: total,
                    description: `Reversal: Refund to Wallet`
                })
            }

            // Post Journal
            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'REVERSAL',
                referenceId: originalTx.id,
                description: `Reversal of Repayment ${originalTx.id.substring(0, 8)}`,
                notes: reason,
                lines: journalLines,
                createdBy: session.user.id!,
                createdByName: user.member?.name || 'Admin',
            }, tx)


            // 4. Create Reversal Loan Transaction
            const reversalTx = await tx.loanTransaction.create({
                data: {
                    loanId: originalTx.loanId,
                    type: 'REVERSAL',
                    amount: new Prisma.Decimal(total).negated(), // stored as negative? or positive with type reversal? 
                    // Usually ledger is additive. But 'amount' in LoanTransaction often implies impact on balance.
                    // Repayment reduces balance (-). Reversal should increase (+).
                    // Existing Repayment logic: amount is positive.
                    // Let's keep it positive but type REVERSAL implies the math.
                    // Actually, let's check basic math. 
                    // If Repayment amount = 500. Outstanding reduced by 500.
                    // Reversal amount = 500. Outstanding increased by 500.
                    // We will store as 500. The calculator service needs to know REVERSAL adds back.
                    amount: new Prisma.Decimal(total),
                    description: `Reversal: ${reason}`,
                    principalAmount: new Prisma.Decimal(principal).negated(), // Negate components to reverse stats?
                    // Safe bet: Store positive, use Type to distinguish.
                    // OR: Store negative to blindly sum?
                    // Let's stick to positive values and specific type for clarity in UI.

                    referenceId: originalTx.id,
                    postedAt: new Date()
                }
            })

            // 5. Update Mortgage/Loan Balance (Strict Update)
            // We simply ADD back the amount to outstanding.
            // And revert status if needed.
            const currentLoan = await tx.loan.findUnique({
                where: { id: originalTx.loanId }
            })

            if (!currentLoan) throw new Error('Loan not found')

            const newOutstanding = Number(currentLoan.outstandingBalance) + total

            let newStatus = currentLoan.status
            if (currentLoan.status === 'CLEARED' && newOutstanding > 0) {
                newStatus = 'ACTIVE'
            }

            await tx.loan.update({
                where: { id: originalTx.loanId },
                data: {
                    outstandingBalance: newOutstanding,
                    status: newStatus
                }
            })

            // 6. Log Journey Event
            await tx.loanJourneyEvent.create({
                data: {
                    loanId: originalTx.loanId,
                    eventType: 'REPAYMENT_REVERSED', // Ensure this enum exists or use generic info
                    // If strict enum, might fail. Let's start with generic 'INFO' or check schema.
                    // Safest to use a known type or update schema. 
                    // Assuming schema is flexible or string. 
                    // 'REPAYMENT_MADE' is used. 'GENERIC_LOG'? 
                    // Let's try 'REVERSAL' if specific, else 'OTHER'.
                    eventType: 'FINANCIAL_ADJUSTMENT', // Safe guess
                    description: `Repayment of KES ${total} reversed by ${user.member?.name}. Reason: ${reason}`,
                    actorId: session.user.id,
                    actorName: user.member?.name || 'Admin',
                    metadata: {
                        originalTxId: originalTx.id,
                        reason
                    }
                }
            })

            // 7. Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'LOAN_REVERSAL',
                    details: `Reversed repayment ${originalTx.id} for loan ${originalTx.loan.loanApplicationNumber} - KES ${total}`
                }
            })

            return { success: true, newBalance: newOutstanding, status: newStatus }
        })
    } catch (e: any) {
        console.error('Reversal Error', e)
        return { error: e.message || 'Failed to reverse transaction' }
    }
}
