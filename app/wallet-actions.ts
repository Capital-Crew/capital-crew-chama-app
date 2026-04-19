'use server'

import { revalidatePath } from 'next/cache'
import { db as prisma } from '@/lib/db'
import { WalletTransactionType, LedgerTransactionType, AuditLogAction } from '@prisma/client'
import { z } from 'zod'
import { auth } from '@/auth'
import { WalletService } from '@/lib/services/WalletService'
import { ContributionsService } from '@/lib/services/contributions-service'
import { withAudit } from '@/lib/with-audit'
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"

/**
 * Record a new contribution with waterfall logic
 */
export const addContribution = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'FINANCE', apiRoute: '/api/wallet/contribution-form' },
    async (ctx, prevState: any, formData: FormData) => {
        const amount = Number(formData.get('amount'))
        const memberId = String(formData.get('memberId'))
        const walletId = String(formData.get('walletId'))

        ctx.beginStep('Validate Contribution Input');
        try {
            const session = await auth()
            if (!session?.user) {
                ctx.setErrorCode('UNAUTHORIZED');
                throw new Error('Unauthorized')
            }

            const schema = z.object({
                amount: z.number().min(50, 'Minimum contribution is 50'),
                memberId: z.string(),
                walletId: z.string()
            })

            const data = schema.parse({ amount, memberId, walletId })
            ctx.endStep('Validate Contribution Input');

            ctx.beginStep('Process Contribution Logic');
            const result = await ContributionsService.recordContribution(data.memberId, data.amount, data.walletId)
            ctx.endStep('Process Contribution Logic');

            revalidatePath('/dashboard')
            revalidatePath(`/members/${memberId}`)

            return { success: true, message: 'Contribution recorded successfully' }
        } catch (error: any) {
            ctx.setErrorCode('CONTRIBUTION_FAILED');
            throw error; // Let withAudit handle the return if needed, but here we might want to return a specific object for the form
        }
    }
);

/**
 * Create a new wallet for a member
 */
export async function createWallet(memberId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    return await WalletService.createWallet(memberId)
}

/**
 * Get wallet balance AND share capital for a member
 */
export async function getWalletBalance(memberId: string): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            contactInfo: true,
            wallet: {
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            },
            loans: {
                where: {
                    status: { in: ['ACTIVE', 'OVERDUE'] }
                }
            }
        }
    })

    if (!member) {
        throw new Error('Member not found')
    }

    const { getMemberContributionBalance, getLoanOutstandingBalance } = await import('@/lib/accounting/AccountingEngine')

    let contributionBalance = 0
    let balance = 0

    balance = await WalletService.getWalletBalance(memberId)
    contributionBalance = await getMemberContributionBalance(memberId)

    const lockedAmount = 0
    const availableBalance = balance - lockedAmount
    
    // Calculate authoritative loan balances from ledger
    const loanBalances = await Promise.all(member.loans.map(loan => getLoanOutstandingBalance(loan.id)))
    const activeLoansAmount = loanBalances.reduce((sum, bal) => sum + bal, 0)

    const settings = await prisma.saccoSettings.findFirst()
    const loanMultiplier = Number(settings?.loanMultiplier) || 3.0
    const loanQualifyingPower = contributionBalance * Number(loanMultiplier)
    const availableLoanLimit = Math.max(0, loanQualifyingPower - activeLoansAmount)

    return serializeFinancials({
        contributionBalance,
        loanQualifyingPower,
        balance,
        lockedAmount,
        availableBalance,
        activeLoansAmount,
        availableLoanLimit,
        phoneNumber: member.contactInfo?.mobile || member.contactInfo?.phone || '',
        transactions: member.wallet?.transactions || []
    })
}

/**
 * Get paginated wallet transaction history
 */
export async function getWalletTransactions(memberId: string, page: number = 1, limit: number = 20): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const wallet = await prisma.wallet.findUnique({
        where: { memberId }
    })

    if (!wallet) {
        throw new Error('Wallet not found')
    }

    const skip = (page - 1) * limit
    const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
            where: { walletId: wallet.id },
            include: {
                relatedLoan: {
                    select: {
                        loanApplicationNumber: true,
                        amount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.walletTransaction.count({
            where: { walletId: wallet.id }
        })
    ])

    return serializeFinancials({
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    })
}

/**
 * Reverse a transaction (for corrections)
 * Creates a new REVERSAL transaction that negates the original
 */
export const reverseTransaction = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_REVERSED, domain: 'FINANCE', apiRoute: '/api/wallet/reverse' },
    async (ctx, transactionId: string, reason: string, userId: string) => {
        ctx.beginStep('Validate Reversal Request');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const userRole = session.user.role as string
        if (userId !== session.user.id && !['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(userRole)) {
            ctx.setErrorCode('INSUFFICIENT_PERMISSIONS');
            throw new Error('Unauthorized: Insufficient permissions to reverse transaction')
        }

        const originalTx = await prisma.walletTransaction.findUnique({
            where: { id: transactionId },
            include: { wallet: true }
        })

        if (!originalTx) {
            ctx.setErrorCode('TRANSACTION_NOT_FOUND');
            throw new Error('Transaction not found')
        }
        ctx.captureBefore('WalletTransaction', originalTx.id, originalTx);

        if (originalTx.reversedBy) {
            ctx.setErrorCode('ALREADY_REVERSED');
            throw new Error('Transaction has already been reversed')
        }

        if (!originalTx.immutable) {
            ctx.setErrorCode('INVALID_TRANSACTION_TYPE');
            throw new Error('Only immutable transactions can be reversed')
        }
        ctx.endStep('Validate Reversal Request');

        ctx.beginStep('Execute Reversal Transaction');
        const isOriginalCredit = ['CONTRIBUTION', 'LOAN_DISBURSEMENT'].includes(originalTx.type)
        const reversalAmount = originalTx.amount

        const result = await prisma.$transaction(async (tx: any) => {
            const reversalTx = await tx.walletTransaction.create({
                data: {
                    walletId: originalTx.walletId,
                    type: 'REVERSAL',
                    amount: reversalAmount,
                    description: `REVERSAL: ${reason} (Original: ${originalTx.description})`,
                    relatedLoanId: originalTx.relatedLoanId,
                    balanceAfter: 0,
                    reverses: originalTx.id,
                    immutable: true
                }
            })

            await tx.walletTransaction.update({
                where: { id: transactionId },
                data: { reversedBy: reversalTx.id }
            })

            await tx.generalLedger.create({
                data: {
                    transactionType: isOriginalCredit ? 'DEBIT' : 'CREDIT',
                    amount: reversalAmount,
                    description: `REVERSAL: ${reason}`,
                    memberId: originalTx.wallet.memberId,
                    walletTransactionId: reversalTx.id
                }
            })

            return reversalTx
        })
        ctx.captureAfter(result);
        ctx.endStep('Execute Reversal Transaction');

        revalidatePath('/wallet')
        return serializeFinancials(result)
    }
);

/**
 * Post an administrative wallet adjustment (Manual Deposit or Withdrawal)
 * Restricted to CHAIRPERSON, TREASURER, SYSTEM_ADMIN
 */
export const postAdminWalletAdjustment = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'FINANCE', apiRoute: '/api/admin/wallet/adjustment' },
    async (ctx, formData: FormData) => {
        ctx.beginStep('Authorize Admin Action');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const userRole = session.user.role as string
        const allowedRoles = ['CHAIRPERSON', 'TREASURER', 'SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR']
        
        if (!allowedRoles.includes(userRole)) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error('Forbidden: Insufficient permissions to perform wallet adjustments')
        }
        ctx.endStep('Authorize Admin Action');

        ctx.beginStep('Validate Adjustment Input');
        const memberId = String(formData.get('memberId'))
        const type = formData.get('type') as 'DEPOSIT' | 'WITHDRAWAL'
        const amount = Number(formData.get('amount'))
        const reference = String(formData.get('reference'))
        const description = String(formData.get('description'))

        if (!memberId) throw new Error('Member ID is required')
        if (!['DEPOSIT', 'WITHDRAWAL'].includes(type)) throw new Error('Invalid adjustment type')
        if (isNaN(amount) || amount <= 0) throw new Error('Amount must be a positive number')
        if (!reference || reference.trim() === '') throw new Error('M-Pesa Reference is mandatory')
        if (!description || description.trim() === '') throw new Error('Description is mandatory')

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: { 
                wallet: { include: { glAccount: true } } 
            }
        })

        if (!member || !member.wallet || !member.wallet.glAccount) {
            ctx.setErrorCode('WALLET_NOT_FOUND');
            throw new Error('Member wallet or GL account not found')
        }
        ctx.endStep('Validate Adjustment Input');

        ctx.beginStep('Execute Ledger Posting');
        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
        
        // contraAccount: For M-Pesa deposits/withdrawals, we typically use the M-Pesa/Cash Clearing account
        // Referenced as EVENT_CASH_DEPOSIT / EVENT_CASH_WITHDRAWAL in SystemAccountType
        const contraType = type === 'DEPOSIT' ? 'EVENT_CASH_DEPOSIT' : 'EVENT_CASH_WITHDRAWAL'
        
        const journal = await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: type === 'DEPOSIT' ? 'SAVINGS_DEPOSIT' : 'SAVINGS_WITHDRAWAL',
            referenceId: memberId,
            externalReferenceId: reference,
            description: `${type} - ${description} (Ref: ${reference})`,
            createdBy: session.user.id,
            createdByName: session.user.name || 'Admin',
            lines: [
                {
                    // For DEPOSIT: Credit Wallet (Increase Liability)
                    // For WITHDRAWAL: Debit Wallet (Decrease Liability)
                    accountId: member.wallet.glAccountId,
                    debitAmount: type === 'WITHDRAWAL' ? amount : 0,
                    creditAmount: type === 'DEPOSIT' ? amount : 0,
                    description: `${type === 'DEPOSIT' ? 'Manual Deposit' : 'Manual Withdrawal'}`
                },
                {
                    // Opposite for Cash/Clearing Account
                    accountCode: (await prisma.systemAccountingMapping.findUnique({
                        where: { type: contraType as any },
                        include: { account: true }
                    }))?.account.code || '1011', // Fallback or strict error
                    debitAmount: type === 'DEPOSIT' ? amount : 0,
                    creditAmount: type === 'WITHDRAWAL' ? amount : 0,
                    description: `M-Pesa Contra-Entry`
                }
            ]
        })
        ctx.endStep('Execute Ledger Posting');

        ctx.beginStep('Update Wallet History');
        const walletTx = await prisma.walletTransaction.create({
            data: {
                walletId: member.wallet.id,
                type: type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
                amount: amount,
                description: `${description} (M-Pesa Ref: ${reference})`,
                externalReference: reference,
                ledgerTransactionId: journal.id,
                immutable: true
            }
        })
        ctx.endStep('Update Wallet History');

        revalidatePath('/admin/system')
        revalidatePath(`/members/${memberId}`)
        
        return { 
            success: true, 
            message: `Wallet ${type.toLowerCase()} of KES ${amount} processed successfully`,
            transactionId: walletTx.id 
        }
    }
)
