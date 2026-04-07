'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { revalidatePath } from 'next/cache'
import { WalletService } from '@/lib/services/WalletService'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction } from '@prisma/client'

/**
 * Get Contribution transaction history for a member
 */
export async function getContributionHistory(memberId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const transactions = await prisma.contributionTransaction.findMany({
        where: { memberId },
        orderBy: { createdAt: sortOrder },
        take: 50 // Limit to recent 50 transactions
    })

    return transactions.map((tx: any) => ({
        id: tx.id,
        date: tx.createdAt,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        creatorName: tx.creatorName
    }))
}

/**
 * Get Withdrawable Balance transaction history for a member
 * Fetches journal entries related to Account 2000 (Member Savings)
 */
export async function getWithdrawableBalanceHistory(memberId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Get member wallet (unique account)
    const wallet = await prisma.wallet.findUnique({
        where: { memberId }
    })

    if (!wallet) {
        return []
    }

    // Get journal lines for this UNIQUE account
    const journalLines = await prisma.ledgerEntry.findMany({
        where: {
            // Fix: Query the specific wallet account, not the global one
            ledgerAccountId: wallet.glAccountId
        },
        include: {
            ledgerTransaction: true
        },
        orderBy: {
            ledgerTransaction: {
                transactionDate: sortOrder
            }
        },
        take: 50
    })

    return journalLines.map((line: any) => ({
        id: line.id,
        date: line.ledgerTransaction.transactionDate,
        description: line.description || line.ledgerTransaction.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        entryNumber: line.ledgerTransaction.id.substring(0, 8).toUpperCase(), // Fallback
        referenceType: line.ledgerTransaction.referenceType
    }))
}

/**
 * Add funds to member's withdrawable balance (Cash Deposit)
 * This is different from Member Contributions - it goes directly to withdrawable balance
 */
export const addCashDeposit = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'WALLET', apiRoute: '/api/wallet/deposit' },
    async (ctx, input: {
        memberId: string
        amount: number
        description: string
    }) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()

        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        if (input.amount <= 0) {
            ctx.setErrorCode('INVALID_AMOUNT');
            throw new Error('Deposit amount must be greater than zero')
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Validate and Fetch Member');
            const member = await prisma.member.findUnique({
                where: { id: input.memberId }
            })

            if (!member) {
                ctx.setErrorCode('MEMBER_NOT_FOUND');
                throw new Error('Member not found')
            }

            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { member: true }
            })
            ctx.endStep('Validate and Fetch Member');

            ctx.beginStep('Post Financial Transaction');
            const wallet = await WalletService.createWallet(input.memberId)
            ctx.captureBefore('Wallet', wallet.id, wallet);

            const mappings = await getSystemMappingsDict()
            const cashAccountCode = mappings.EVENT_CASH_DEPOSIT || mappings.CASH_ON_HAND
            if (!cashAccountCode) {
                ctx.setErrorCode('SYSTEM_CONFIG_ERROR');
                throw new Error("System Mapping 'EVENT_CASH_DEPOSIT' or 'CASH_ON_HAND' not configured.")
            }

            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'SAVINGS_DEPOSIT',
                referenceId: input.memberId,
                description: `Cash deposit - ${member.name}`,
                notes: input.description,
                lines: [
                    {
                        accountCode: cashAccountCode,
                        debitAmount: input.amount,
                        creditAmount: 0,
                        description: 'Cash received'
                    },
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: 0,
                        creditAmount: input.amount,
                        description: `${member.name} deposit`
                    }
                ],
                createdBy: session.user.id,
                createdByName: user?.member?.name || user?.name || (session.user.name as string) || 'System'
            })
            ctx.endStep('Post Financial Transaction', { jeId: journalEntry.id });

            ctx.beginStep('Verification and Status Update');
            const updatedWallet = await prisma.wallet.findUnique({
                where: { id: wallet.id }
            })
            ctx.captureAfter(updatedWallet);
            ctx.endStep('Verification and Status Update');

            revalidatePath('/wallet')
            revalidatePath('/dashboard')
            revalidatePath('/accounts')

            return {
                success: true,
                journalEntryNumber: journalEntry.id
            }
        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            throw error;
        }
    }
);
