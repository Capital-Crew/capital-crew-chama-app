'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, AuditLogAction } from '@prisma/client'
import { AccountingEngine, getLoanPrincipalBalance, getLoanInterestBalance, getLoanPenaltyBalance } from '@/lib/accounting/AccountingEngine'
import { PostingRules } from '@/lib/accounting/PostingRules'
import { LoanBalanceService } from '@/services/loan-balance';
import { withAudit } from '@/lib/with-audit';

// Use global db instance
const prisma = db

/**
 * Repay a loan
 * Allocates payment in order: Penalty → Interest → Principal
 * Uses accounting engine for double-entry posting
 */
export const repayLoan = withAudit(
    { actionType: AuditLogAction.FINANCIAL_RECORD_RECORDED, domain: 'LOAN', apiRoute: '/api/loans/repay' },
    async (ctx, loanId: string, amount: number) => {
        ctx.beginStep('Validate Repayment Request');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        if (!user?.member) {
            ctx.setErrorCode('MEMBER_NOT_FOUND');
            throw new Error('No member associated with this user')
        }

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                member: { include: { wallet: true } },
                loanProduct: true
            }
        })

        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error('Loan not found')
        }
        ctx.captureBefore('Loan', loan.id, loan);

        if (loan.status !== 'ACTIVE') {
            ctx.setErrorCode('INVALID_LOAN_STATUS');
            throw new Error('Loan is not active')
        }

        if (amount <= 0) {
            ctx.setErrorCode('INVALID_AMOUNT');
            throw new Error('Payment amount must be greater than 0')
        }
        ctx.endStep('Validate Repayment Request');

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            ctx.beginStep('Retrieve Outstanding Balances');
            // Get outstanding balances from General Ledger (source of truth)
            const outstandingPenalty = await getLoanPenaltyBalance(loanId)
            const outstandingInterest = await getLoanInterestBalance(loanId)
            const outstandingPrincipal = await getLoanPrincipalBalance(loanId)

            const totalOutstanding = outstandingPenalty + outstandingInterest + outstandingPrincipal

            // STRICT: Reject overpayments
            if (amount > totalOutstanding) {
                ctx.setErrorCode('OVERPAYMENT_REJECTED');
                throw new Error(`Payment amount (${amount.toLocaleString()}) exceeds total outstanding balance (${totalOutstanding.toLocaleString()}). Please adjust the amount.`)
            }
            ctx.endStep('Retrieve Outstanding Balances', { totalOutstanding });

            ctx.beginStep('Allocate Payment');
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
            ctx.endStep('Allocate Payment', { allocation });

            ctx.beginStep('Post Journal Entry');
            const { getSystemMappingsDict } = await import('@/app/actions/system-accounting');
            const mappings = await getSystemMappingsDict();

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
            ctx.endStep('Post Journal Entry', { jeId: journalEntry.id });

            ctx.beginStep('Create Loan Transaction Record');
            const description = [
                allocation.principal > 0 ? `Principal: ${allocation.principal.toLocaleString()}` : null,
                allocation.interest > 0 ? `Interest: ${allocation.interest.toLocaleString()}` : null,
                allocation.penalty > 0 ? `Penalty: ${allocation.penalty.toLocaleString()}` : null
            ].filter(Boolean).join(', ');

            await tx.loanTransaction.create({
                data: {
                    loanId: loan.id,
                    type: 'REPAYMENT',
                    amount: new Prisma.Decimal(amount),
                    description: `Repayment: ${description} (Ref: ${journalEntry.id})`,
                    principalAmount: new Prisma.Decimal(allocation.principal),
                    interestAmount: new Prisma.Decimal(allocation.interest),
                    penaltyAmount: new Prisma.Decimal(allocation.penalty),
                    referenceId: journalEntry.id,
                    postedAt: new Date()
                }
            });
            ctx.endStep('Create Loan Transaction Record');

            ctx.beginStep('Force Balance Recalculation');
            const verifiedBalance = await LoanBalanceService.updateLoanBalance(loanId, tx);
            ctx.endStep('Force Balance Recalculation', { verifiedBalance: verifiedBalance.toString() });

            ctx.beginStep('Update Wallet Transaction');
            await tx.walletTransaction.create({
                data: {
                    walletId: loan.member.wallet!.id,
                    type: 'REPAYMENT',
                    amount: amount,
                    description: `Loan repayment: ${loan.loanApplicationNumber}`,
                    relatedLoanId: loan.id,
                    balanceAfter: 0,
                    immutable: true
                }
            })
            ctx.endStep('Update Wallet Transaction');

            const isFullyPaid = verifiedBalance.toNumber() === 0;

            if (isFullyPaid) {
                ctx.beginStep('Clear Loan Status');
                await tx.loan.update({
                    where: { id: loanId },
                    data: { status: 'CLEARED' }
                })
                await tx.loanJourneyEvent.create({
                    data: {
                        loanId: loan.id,
                        eventType: 'LOAN_CLEARED',
                        description: `Loan fully repaid. Final Balance: ${verifiedBalance.toString()}`,
                        actorId: session.user.id,
                        actorName: user.member!.name,
                        metadata: { finalPayment: amount, allocation, journalEntryId: journalEntry.id } as any
                    }
                })
                ctx.endStep('Clear Loan Status');
            } else {
                ctx.beginStep('Log Repayment Event');
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
                        } as any
                    }
                })
                ctx.endStep('Log Repayment Event');
            }

            return {
                success: true,
                allocation,
                journalEntryId: journalEntry.id,
                loanCleared: isFullyPaid,
                remainingBalance: verifiedBalance.toNumber()
            }
        })

        const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });
        if (updatedLoan) ctx.captureAfter(updatedLoan);

        revalidatePath('/loans')
        revalidatePath('/dashboard')
        revalidatePath(`/members/${loan.memberId}`)
        revalidatePath(`/loans/${loanId}`)

        return result;
    })
