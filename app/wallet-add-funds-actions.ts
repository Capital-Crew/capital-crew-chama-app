'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, AuditLogAction } from '@prisma/client'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { WalletService } from '@/lib/services/WalletService'
import { withIdempotency } from '@/lib/idempotency'
import { withAudit } from '@/lib/with-audit'

/**
 * Add Member Contribution
 * 
 * Business Rules:
 * - Non-withdrawable (increases contribution balance)
 * - Increases loan qualification (multiplier applied)
 * - Posts to Account 1200 (Contributions & Loan Portfolio)
 * - Debits member wallet, credits contributions
 * - Updates MonthlyTracker with waterfall logic (arrears → current → future)
 */
export const addContribution = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'FINANCE', apiRoute: '/api/wallet/contribution' },
    async (ctx, input: {
        memberId: string
        amount: number
        description: string
        idempotencyKey?: string
    }) => {
        ctx.beginStep('Validate Contribution Request');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const businessLogic = async () => {
            if (input.amount <= 0) {
                ctx.setErrorCode('INVALID_AMOUNT');
                throw new Error('Amount must be greater than zero')
            }

            const member = await prisma.member.findUnique({
                where: { id: input.memberId },
                include: { wallet: true }
            })

            if (!member) {
                ctx.setErrorCode('MEMBER_NOT_FOUND');
                throw new Error('Member not found')
            }
            ctx.captureBefore('Member', member.id, member);

            if (!member.wallet) {
                ctx.setErrorCode('WALLET_NOT_FOUND');
                throw new Error('Member wallet not found')
            }

            const walletBalance = await getMemberWalletBalance(input.memberId)
            if (input.amount > walletBalance) {
                ctx.setErrorCode('INSUFFICIENT_FUNDS');
                throw new Error(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`)
            }

            const { ContributionsService } = await import('@/lib/services/contributions-service')
            await ContributionsService.recordContribution(
                input.memberId,
                input.amount,
                member.wallet.id
            )

            revalidatePath('/wallet')
            revalidatePath('/dashboard')
            revalidatePath('/accounts')
            revalidatePath(`/members/${input.memberId}`)

            const updatedMember = await prisma.member.findUnique({
                where: { id: input.memberId },
                select: { contributionBalance: true }
            })
            if (updatedMember) ctx.captureAfter(updatedMember);

            return {
                success: true,
                message: 'Contribution recorded successfully',
                newShareBalance: Number(updatedMember?.contributionBalance || 0)
            }
        }

        if (input.idempotencyKey) {
            return await withIdempotency({
                key: input.idempotencyKey,
                path: 'addContribution',
                businessLogic
            })
        }
        return await businessLogic()
    }
);

/**
 * Add Penalty Payment
 */
export const addPenaltyPayment = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'FINANCE', apiRoute: '/api/wallet/penalty' },
    async (ctx, input: {
        memberId: string
        amount: number
        description: string
        idempotencyKey?: string
    }) => {
        ctx.beginStep('Validate Penalty Request');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const businessLogic = async () => {
            if (input.amount <= 0) {
                ctx.setErrorCode('INVALID_AMOUNT');
                throw new Error('Amount must be greater than zero')
            }

            const member = await prisma.member.findUnique({
                where: { id: input.memberId }
            })

            if (!member) {
                ctx.setErrorCode('MEMBER_NOT_FOUND');
                throw new Error('Member not found')
            }
            ctx.captureBefore('Member', member.id, member);

            const walletBalance = await getMemberWalletBalance(input.memberId)
            if (input.amount > walletBalance) {
                ctx.setErrorCode('INSUFFICIENT_FUNDS');
                throw new Error(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`)
            }

            const mappings = await getSystemMappingsDict()
            if (!mappings.REVENUE_LOAN_PENALTY) {
                ctx.setErrorCode('SYSTEM_CONFIG_ERROR');
                throw new Error('System mapping for REVENUE_LOAN_PENALTY not found')
            }

            const wallet = await WalletService.createWallet(input.memberId)
            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'MANUAL_ADJUSTMENT',
                referenceId: input.memberId,
                description: `Penalty payment - ${member.name}`,
                notes: input.description,
                lines: [
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: input.amount,
                        creditAmount: 0,
                        description: `${member.name} penalty withdrawal`
                    },
                    {
                        accountCode: mappings.REVENUE_LOAN_PENALTY,
                        debitAmount: 0,
                        creditAmount: input.amount,
                        description: 'Penalty revenue received'
                    }
                ],
                createdBy: session.user.id,
                createdByName: session.user.name || 'System'
            })

            revalidatePath('/wallet')
            revalidatePath('/dashboard')
            revalidatePath('/accounts')

            return {
                success: true,
                journalEntryId: journalEntry.id,
                newWithdrawableBalance: walletBalance - input.amount
            }
        }

        if (input.idempotencyKey) {
            return await withIdempotency({
                key: input.idempotencyKey,
                path: 'addPenaltyPayment',
                businessLogic
            })
        }
        return await businessLogic()
    }
);

/**
 * Add Loan Repayment
 */
export const addLoanRepayment = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'LOAN', apiRoute: '/api/wallet/loan-repay' },
    async (ctx, input: {
        memberId: string
        loanId: string
        amount: number
        description: string
        idempotencyKey?: string
    }) => {
        ctx.beginStep('Validate Repayment Request');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const businessLogic = async () => {
            if (input.amount <= 0) {
                ctx.setErrorCode('INVALID_AMOUNT');
                throw new Error('Amount must be greater than zero')
            }

            const loan = await prisma.loan.findUnique({
                where: { id: input.loanId },
                include: { member: true, loanProduct: { select: { name: true } } }
            })

            if (!loan) {
                ctx.setErrorCode('LOAN_NOT_FOUND');
                throw new Error('Loan not found')
            }
            ctx.captureBefore('Loan', loan.id, loan);

            if (loan.memberId !== input.memberId) {
                ctx.setErrorCode('INSUFFICIENT_PERMISSIONS');
                throw new Error('Loan does not belong to this member')
            }

            if (!['ACTIVE', 'OVERDUE'].includes(loan.status)) {
                ctx.setErrorCode('INVALID_LOAN_STATUS');
                throw new Error(`Cannot repay loan with status: ${loan.status}`)
            }

            const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')
            const penaltyBalance = await getLoanPenaltyBalance(input.loanId)
            const interestBalance = await getLoanInterestBalance(input.loanId)
            let principalBalance = await getLoanPrincipalBalance(input.loanId)
            const feesBalance = await getLoanFeeBalance(input.loanId)

            const balances = { penalty: penaltyBalance, fees: feesBalance, interest: interestBalance, principal: principalBalance }
            let totalOutstanding = balances.penalty + balances.fees + balances.interest + balances.principal

            if (totalOutstanding <= 0) {
                balances.principal = Number(loan.amount)
                totalOutstanding = balances.principal
            }

            if (input.amount > totalOutstanding) {
                ctx.setErrorCode('OVERPAYMENT_REJECTED');
                throw new Error(`Repayment amount exceeds outstanding balance`)
            }

            const { distributeRepayment } = await import('@/lib/finance/waterfall')
            const allocation = distributeRepayment(input.amount, balances)

            const mappings = await getSystemMappingsDict()
            const wallet = await WalletService.createWallet(input.memberId)
            const walletBalance = await getMemberWalletBalance(input.memberId)
            if (input.amount > walletBalance) {
                ctx.setErrorCode('INSUFFICIENT_FUNDS');
                throw new Error(`Insufficient wallet balance`)
            }

            const journalLines: any[] = []
            if (allocation.paidPenalty > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_PENALTY, debitAmount: 0, creditAmount: allocation.paidPenalty, description: 'Penalty paid' })
            if (allocation.paidFees > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_FEES, debitAmount: 0, creditAmount: allocation.paidFees, description: 'Fees paid' })
            if (allocation.paidInterest > 0) journalLines.push({ accountCode: mappings.RECEIVABLE_LOAN_INTEREST, debitAmount: 0, creditAmount: allocation.paidInterest, description: 'Interest paid' })
            if (allocation.paidPrincipal > 0) journalLines.push({ accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, debitAmount: 0, creditAmount: allocation.paidPrincipal, description: 'Principal paid' })
            journalLines.push({ accountId: wallet.glAccountId, debitAmount: input.amount, creditAmount: 0, description: 'Loan repayment withdrawal' })

            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_REPAYMENT',
                referenceId: input.loanId,
                description: `Loan repayment - ${loan.loanApplicationNumber}`,
                notes: input.description,
                lines: journalLines,
                createdBy: session.user.id,
                createdByName: session.user.name || 'System'
            })

            const newOutstanding = totalOutstanding - input.amount
            const isFullyPaid = Math.abs(newOutstanding) < 0.01

            if (isFullyPaid) {
                await prisma.loan.update({ where: { id: input.loanId }, data: { status: 'CLEARED' } })
            }

            await prisma.loanJourneyEvent.create({
                data: {
                    loanId: input.loanId,
                    eventType: 'REPAYMENT_MADE',
                    description: `Repayment of KES ${input.amount.toLocaleString()}`,
                    actorId: session.user.id,
                    actorName: session.user.name || 'System',
                    metadata: { amount: input.amount, allocation, journalEntryId: journalEntry.id } as any
                }
            })

            await prisma.loanTransaction.create({
                data: {
                    loanId: input.loanId,
                    type: 'REPAYMENT',
                    amount: new Prisma.Decimal(input.amount),
                    description: input.description,
                    principalAmount: new Prisma.Decimal(allocation.paidPrincipal),
                    interestAmount: new Prisma.Decimal(allocation.paidInterest),
                    penaltyAmount: new Prisma.Decimal(allocation.paidPenalty),
                    feeAmount: new Prisma.Decimal(allocation.paidFees),
                    postedAt: new Date(),
                    referenceId: journalEntry.id
                }
            })

            // Note: outstandingBalance is now derived from Ledger. 
            // We only update status if fully paid (handled above).
            const updatedLoan = await prisma.loan.findUnique({
                where: { id: input.loanId }
            })
            if (updatedLoan) ctx.captureAfter(updatedLoan);

            revalidatePath('/wallet')
            revalidatePath('/loans')
            revalidatePath('/dashboard')
            revalidatePath(`/members/${input.memberId}`)

            const receiptData = {
                transactionId: journalEntry.id,
                date: new Date(),
                memberName: loan.member.name,
                memberNumber: loan.member.memberNumber || 'N/A',
                amount: input.amount,
                loanNumber: loan.loanApplicationNumber,
                loanProduct: loan.loanProduct.name,
                remainingBalance: newOutstanding,
                allocation: {
                    penalty: allocation.paidPenalty,
                    fees: allocation.paidFees,
                    interest: allocation.paidInterest,
                    principal: allocation.paidPrincipal
                }
            }

            return {
                success: true,
                journalEntryId: journalEntry.id,
                allocation,
                newOutstanding,
                isFullyPaid,
                loanStatus: isFullyPaid ? 'CLEARED' : loan.status,
                receiptData
            }
        }

        if (input.idempotencyKey) {
            return await withIdempotency({
                key: input.idempotencyKey,
                path: 'addLoanRepayment',
                businessLogic
            })
        }
        return await businessLogic()
    }
);

/**
 * Get active loans for a member
 */
export async function getActiveLoansByMember(memberId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const loans = await prisma.loan.findMany({
        where: { memberId, status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: { loanProduct: { select: { name: true } }, _count: { select: { transactions: true } } },
        orderBy: { applicationDate: 'desc' }
    })

    const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')

    const loansWithBalances = await Promise.all(
        loans.map(async (loan: any) => {
            let penalty = 0, interest = 0, principal = 0, fees = 0
            try {
                penalty = await getLoanPenaltyBalance(loan.id)
                interest = await getLoanInterestBalance(loan.id)
                principal = await getLoanPrincipalBalance(loan.id)
                fees = await getLoanFeeBalance(loan.id)
            } catch (error) { }

            let outstanding = penalty + interest + principal + fees
            if (outstanding <= 0 && loan._count.transactions === 0) {
                principal = Number(loan.amount)
                outstanding = principal
            }
            if (outstanding < 0.01) outstanding = 0

            let finalStatus = loan.status
            if (outstanding === 0 && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && loan._count.transactions > 0) {
                try {
                    await prisma.loan.update({ where: { id: loan.id }, data: { status: 'CLEARED' } })
                    finalStatus = 'CLEARED'
                } catch (err) { }
            }

            return {
                id: loan.id,
                loanApplicationNumber: loan.loanApplicationNumber,
                productName: loan.loanProduct.name,
                disbursedAmount: Number(loan.amount),
                outstandingBalance: outstanding,
                penaltyBalance: penalty,
                interestBalance: interest,
                principalBalance: principal,
                feesBalance: fees,
                status: finalStatus
            }
        })
    )

    return loansWithBalances.filter(loan => loan.outstandingBalance > 0)
}

/**
 * Get fresh loan balance
 */
export async function getLoanFreshBalance(loanId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')

    let penalty = 0, interest = 0, principal = 0, fees = 0
    try {
        penalty = await getLoanPenaltyBalance(loanId)
        interest = await getLoanInterestBalance(loanId)
        principal = await getLoanPrincipalBalance(loanId)
        fees = await getLoanFeeBalance(loanId)
    } catch (e) { }

    let outstanding = penalty + interest + principal + fees
    if (outstanding < 0.01) outstanding = 0

    return { outstandingBalance: outstanding, penaltyBalance: penalty, interestBalance: interest, principalBalance: principal, feesBalance: fees }
}
