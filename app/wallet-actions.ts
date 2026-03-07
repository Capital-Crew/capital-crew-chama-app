'use server'

import { revalidatePath } from 'next/cache'
import { db as prisma } from '@/lib/db'
import { WalletTransactionType, LedgerTransactionType } from '@prisma/client'
import { z } from 'zod'

import { WalletService } from '@/lib/services/WalletService'
import { ContributionsService } from '@/lib/services/contributions-service'

/**
 * Record a new contribution with waterfall logic
 */
export async function addContribution(prevState: any, formData: FormData) {
    const amount = Number(formData.get('amount'))
    const memberId = String(formData.get('memberId'))
    const walletId = String(formData.get('walletId'))

    try {
        const schema = z.object({
            amount: z.number().min(50, 'Minimum contribution is 50'),
            memberId: z.string(),
            walletId: z.string()
        })

        const data = schema.parse({ amount, memberId, walletId })

        await ContributionsService.recordContribution(data.memberId, data.amount, data.walletId)

        revalidatePath('/dashboard')
        revalidatePath(`/members/${memberId}`)

        return { success: true, message: 'Contribution recorded successfully' }
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to record contribution' }
    }
}

// Zod schema for validation (not exported - internal use only)
const walletTransactionSchema = z.object({
    type: z.enum(['CONTRIBUTION', 'LOAN_DISBURSEMENT', 'REPAYMENT', 'FEE', 'PENALTY']),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(500),
    relatedLoanId: z.string().optional()
})

/**
 * Create a new wallet for a member
 * Automatically called when a new member is created
 */


/**
 * Create a new wallet for a member
 * Automatically called when a new member is created
 */
export async function createWallet(memberId: string) {
    return await WalletService.createWallet(memberId)
}

/**
 * Get wallet balance AND share capital for a member
 * 
 * CRITICAL: Returns BOTH:
 * - shareContributions (equity, non-withdrawable)
 * - balance (liquid, withdrawable)
 */
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
// ... existing imports ...

// ... existing code ...

/**
 * Get wallet balance AND share capital for a member
 * 
 * CRITICAL: Returns BOTH:
 * - shareContributions (equity, non-withdrawable)
 * - balance (liquid, withdrawable)
 */
export async function getWalletBalance(memberId: string): Promise<Serialized<any>> {
    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            wallet: {
                include: {
                    transactions: {
                        orderBy: { createdAt: 'desc' },
                        take: 10 // Just for display
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

    // ========================================
    // LEDGER-BASED BALANCE CALCULATION
    // Source of Truth: General Ledger
    // ========================================

    const { getMemberContributionBalance } = await import('@/lib/accounting/AccountingEngine')


    // Get actual balances from General Ledger
    let walletBalance = 0
    let shareContributions = 0

    try {
        // Member Wallet Account
        walletBalance = await WalletService.getWalletBalance(memberId)

        // Contributions Account (Legacy/Pending Refactor)
        // shareContributions = await getMemberContributionBalance(memberId)
        // Fallback for shares until refactored:
        shareContributions = Number(member.shareContributions) || 0

    } catch (error) {
        shareContributions = Number(member.shareContributions) || 0
        // walletBalance remains 0 if error
    }

    const balance = walletBalance
    const lockedAmount = 0 // TODO: Implement locking mechanism
    const availableBalance = balance - lockedAmount

    // Active loans amount (Use outstandingBalance)
    const activeLoansAmount = member.loans.reduce((sum: number, loan: any) => sum + Number(loan.outstandingBalance), 0)

    // Get SACCO settings for loan qualification
    const settings = await prisma.saccoSettings.findFirst()
    const loanMultiplier = Number(settings?.loanMultiplier) || 3.0

    // Loan qualifying power (based on SHARES, not balance)
    const loanMultiplierNum = Number(loanMultiplier)
    const loanQualifyingPower = shareContributions * loanMultiplierNum
    const availableLoanLimit = Math.max(0, loanQualifyingPower - activeLoansAmount)

    return serializeFinancials({
        // SHARES (EQUITY) - Non-withdrawable
        shareContributions,
        loanQualifyingPower,        // = shareContributions × multiplier

        // BALANCE (LIQUID) - Withdrawable
        balance,
        lockedAmount,
        availableBalance,            // = balance - locked

        // LOANS
        activeLoansAmount,
        availableLoanLimit,          // = loanQualifyingPower - activeLoans

        // Recent transactions (Display purposes)
        transactions: member.wallet?.transactions || []
    })
}

/**
 * Get paginated wallet transaction history
 */
export async function getWalletTransactions(memberId: string, page: number = 1, limit: number = 20): Promise<Serialized<any>> {
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
 * @deprecated LEGACY FUNCTION - DO NOT USE
 * 
 * This function is deprecated and has been replaced by modern, ledger-integrated actions:
 * - For withdrawals: Use `withdrawFunds()` from wallet-withdraw-actions.ts
 * - For contributions: Use `addContribution()` from wallet-add-funds-actions.ts
 * - For loan repayments: Use `addLoanRepayment()` from wallet-add-funds-actions.ts
 * - For penalty payments: Use `addPenaltyPayment()` from wallet-add-funds-actions.ts
 * 
 * This function does NOT use AccountingEngine and violates the "ledger as source of truth" principle.
 * It has been disabled to prevent accidental use.
 */
export async function createWalletTransaction(input: {
    memberId: string
    type: WalletTransactionType
    amount: number
    description: string
    relatedLoanId?: string
    userId: string
}) {
    throw new Error(
        'createWalletTransaction is deprecated. Use modern actions: withdrawFunds, addContribution, addLoanRepayment, or addPenaltyPayment from wallet-add-funds-actions.ts or wallet-withdraw-actions.ts'
    )
}

/**
 * Reverse a transaction (for corrections)
 * Creates a new REVERSAL transaction that negates the original
 */
export async function reverseTransaction(transactionId: string, reason: string, userId: string): Promise<Serialized<any>> {
    const originalTx = await prisma.walletTransaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true }
    })

    if (!originalTx) {
        throw new Error('Transaction not found')
    }

    if (originalTx.reversedBy) {
        throw new Error('Transaction has already been reversed')
    }

    if (!originalTx.immutable) {
        throw new Error('Only immutable transactions can be reversed')
    }

    // Create reversal transaction
    const isOriginalCredit = ['CONTRIBUTION', 'LOAN_DISBURSEMENT'].includes(originalTx.type)
    const reversalAmount = originalTx.amount
    // const newBalance = originalTx.wallet.balance + (isOriginalCredit ? -reversalAmount : reversalAmount)
    const newBalance = 0 // Dummy value, field removed

    const result = await prisma.$transaction(async (tx: any) => {
        // Create reversal transaction
        const reversalTx = await tx.walletTransaction.create({
            data: {
                walletId: originalTx.walletId,
                type: 'REVERSAL',
                amount: reversalAmount,
                description: `REVERSAL: ${reason} (Original: ${originalTx.description})`,
                relatedLoanId: originalTx.relatedLoanId,
                balanceAfter: newBalance,
                reverses: originalTx.id,
                immutable: true
            }
        })

        // Mark original as reversed
        await tx.walletTransaction.update({
            where: { id: transactionId },
            data: { reversedBy: reversalTx.id }
        })

        // Update wallet balance - REMOVED (Balance is derived)
        /* await tx.wallet.update({
             where: { id: originalTx.walletId },
             data: { balance: newBalance }
         }) */

        // Create ledger entry
        await tx.generalLedger.create({
            data: {
                transactionType: isOriginalCredit ? 'DEBIT' : 'CREDIT',
                amount: reversalAmount,
                description: `REVERSAL: ${reason}`,
                memberId: originalTx.wallet.memberId,
                walletTransactionId: reversalTx.id
            }
        })

        // Audit log
        await tx.auditLog.create({
            data: {
                userId,
                action: 'WALLET_TRANSACTION_REVERSED',
                details: `Reversed transaction ${transactionId}: ${reason}`
            }
        })

        return reversalTx
    })

    revalidatePath('/wallet')

    return serializeFinancials(result)
}
