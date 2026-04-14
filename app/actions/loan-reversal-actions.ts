'use server'

import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'
import { REVERSAL_WINDOW_DAYS } from '@/lib/services/TransactionReversalService'
import { Prisma, AuditLogAction } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { differenceInDays } from 'date-fns'
import { withAudit } from '@/lib/with-audit'

/**
 * Reverse a Loan Transaction
 */
export const reverseLoanTransaction = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_REVERSED, domain: 'LOAN', apiRoute: '/api/loans/reverse' },
    async (ctx, transactionId: string, reason: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        if (!user || !['SYSTEM_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
            ctx.setErrorCode('FORBIDDEN');
            return { error: 'Permission Denied: Only Admins can reverse transactions' }
        }

        if (!reason || reason.length < 5) {
            ctx.setErrorCode('INVALID_REASON');
            return { error: 'Please provide a valid reason for reversal' }
        }
        ctx.endStep('Verify Authorization');

        try {
            return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                ctx.beginStep('Validate Original Transaction');
                const originalTx = await tx.loanTransaction.findUnique({
                    where: { id: transactionId },
                    include: {
                        loan: {
                            include: { member: { include: { wallet: true } } }
                        }
                    }
                })

                if (!originalTx) {
                    ctx.setErrorCode('TRANSACTION_NOT_FOUND');
                    throw new Error('Transaction not found')
                }
                ctx.captureBefore('LoanTransaction', transactionId, originalTx);

                if (originalTx.isReversed) {
                    ctx.setErrorCode('ALREADY_REVERSED');
                    throw new Error('This transaction has already been reversed')
                }

                const txDate = originalTx.transactionDate || originalTx.postedAt
                const daysSince = differenceInDays(new Date(), txDate)
                if (daysSince > REVERSAL_WINDOW_DAYS) {
                    ctx.setErrorCode('TIME_LIMIT_EXCEEDED');
                    throw new Error(`Reversal time limit exceeded. Transaction is ${daysSince} days old (Limit: ${REVERSAL_WINDOW_DAYS} days).`)
                }
                ctx.endStep('Validate Original Transaction');

                ctx.beginStep('Execute Soft Reversal');
                await tx.loanTransaction.update({
                    where: { id: transactionId },
                    data: {
                        isReversed: true,
                        reversedAt: new Date()
                    }
                })
                ctx.endStep('Execute Soft Reversal');

                ctx.beginStep('Execute GL Contra Reversal');
                const linkedGlEntry = await tx.ledgerTransaction.findFirst({
                    where: { externalReferenceId: transactionId }
                })

                if (linkedGlEntry) {
                    await AccountingEngine.reverseJournalEntry(
                        linkedGlEntry.id,
                        reason,
                        session.user.id!,
                        user.member?.name || 'Admin',
                        tx
                    )
                } else {
                    const mappings = await getSystemMappingsDict()
                    const journalLines: any[] = []
                    const amount = Number(originalTx.amount)
                    const principal = Number(originalTx.principalAmount)
                    const interest = Number(originalTx.interestAmount)
                    const penalty = Number(originalTx.penaltyAmount)
                    const fees = Number(originalTx.feeAmount)

                    if (originalTx.type === 'REPAYMENT') {
                        if (principal > 0) journalLines.push({ accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, debitAmount: principal, creditAmount: 0, description: `Reversal: Principal` })
                        if (interest > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_INTEREST, debitAmount: interest, creditAmount: 0, description: `Reversal: Interest` })
                        if (penalty > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_PENALTY, debitAmount: penalty, creditAmount: 0, description: `Reversal: Penalty` })
                        if (fees > 0 && mappings.RECEIVABLE_LOAN_FEES) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_FEES, debitAmount: fees, creditAmount: 0, description: `Reversal: Fees` })

                        if (originalTx.loan.member.wallet) {
                            journalLines.push({
                                accountId: originalTx.loan.member.wallet.glAccountId,
                                debitAmount: 0,
                                creditAmount: amount,
                                description: `Reversal: Refund to Wallet`
                            })
                        }
                    } else if (originalTx.type === 'DISBURSEMENT') {
                        if (originalTx.loan.member.wallet) {
                            journalLines.push({
                                accountId: originalTx.loan.member.wallet.glAccountId,
                                debitAmount: amount,
                                creditAmount: 0,
                                description: `Reversal: Return Disbursement`
                            })
                        }
                        journalLines.push({ accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, debitAmount: 0, creditAmount: amount, description: `Reversal: Cancel Disbursement` })
                    } else if (originalTx.type === 'PENALTY_APPLIED' || originalTx.type === 'PENALTY') {
                        // REVERSED PENALTY: MUST REDUCE penaltyDue in schedule!
                        // And reverse the Ledger (Dr Penalty Income / Cr Member Loan)
                        journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_PENALTY, debitAmount: 0, creditAmount: amount, description: `Reversal: Penalty Applied` })
                        journalLines.push({ accountCode: mappings.REVENUE_LOAN_PENALTY, debitAmount: amount, creditAmount: 0, description: `Reversal: Cancel Penalty Revenue` })
                    }

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
                ctx.endStep('Execute GL Contra Reversal');

                // NEW: Operational Rollback for Penalties
                if (originalTx.type === 'PENALTY_APPLIED' || originalTx.type === 'PENALTY') {
                    ctx.beginStep('Operational Penalty Rollback');
                    // 1. Clear penaltyDue from ALL installments that might have been penalized by this transaction
                    // (Usually just one, but we search by loanId and Amount for safety if no direct link)
                    await tx.repaymentInstallment.updateMany({
                        where: {
                            loanId: originalTx.loanId,
                            penaltyDue: originalTx.amount
                        },
                        data: {
                            penaltyDue: 0
                        }
                    })

                    // 2. Decrement Loan.penalties is removed as field is deprecated
                    ctx.endStep('Operational Penalty Rollback');
                }

                ctx.beginStep('Create Reversal Record');
                await tx.loanTransaction.create({
                    data: {
                        loanId: originalTx.loanId,
                        type: 'REVERSAL',
                        amount: originalTx.amount,
                        principalAmount: originalTx.principalAmount,
                        interestAmount: originalTx.interestAmount,
                        penaltyAmount: originalTx.penaltyAmount,
                        feeAmount: originalTx.feeAmount,
                        description: `Reversal: ${originalTx.type} (${reason})`,
                        referenceId: originalTx.id,
                        postedAt: new Date(),
                        transactionDate: new Date(),
                        isReversed: false
                    }
                })
                ctx.endStep('Create Reversal Record');

                // Disbursement Reversal: Cancel the loan entirely
                if (originalTx.type === 'DISBURSEMENT') {
                    ctx.beginStep('Cancel Loan (Disbursement Reversed)');

                    // 1. Set loan status to CANCELLED and clear cached penalties
                    await tx.loan.update({
                        where: { id: originalTx.loanId },
                        data: {
                            status: 'CANCELLED',
                            penalties: 0,
                        }
                    })

                    // 2. Void all installments
                    await tx.repaymentInstallment.updateMany({
                        where: { loanId: originalTx.loanId },
                        data: {
                            principalDue: 0,
                            interestDue: 0,
                            penaltyDue: 0,
                            feeDue: 0,
                            principalPaid: 0,
                            interestPaid: 0,
                            penaltyPaid: 0,
                            feesPaid: 0,
                            isFullyPaid: true,
                        }
                    })

                    // 3. Mark all other active transactions on this loan as reversed
                    //    (e.g. penalties that were applied after disbursement)
                    await tx.loanTransaction.updateMany({
                        where: {
                            loanId: originalTx.loanId,
                            isReversed: false,
                            type: { notIn: ['REVERSAL'] },
                            id: { not: originalTx.id },
                        },
                        data: {
                            isReversed: true,
                            reversedAt: new Date(),
                        }
                    })

                    ctx.endStep('Cancel Loan (Disbursement Reversed)');
                }

                ctx.beginStep('Trigger Replay Engine');
                await TransactionReplayService.replayTransactions(originalTx.loanId, undefined, tx)
                ctx.endStep('Trigger Replay Engine');

                const updatedLoan = await tx.loan.findUnique({ where: { id: originalTx.loanId } });
                if (updatedLoan) ctx.captureAfter(updatedLoan);

                revalidatePath(`/loans/${originalTx.loanId}`)
                revalidatePath('/loans')
                revalidatePath(`/members/${originalTx.loan.memberId}`)

                return { success: true }
            }, {
                maxWait: 5000,
                timeout: 60000
            })
        } catch (e: any) {
            ctx.setErrorCode('REVERSAL_FAILED');
            return { error: e.message || 'Failed to reverse transaction' }
        }
    }
);
