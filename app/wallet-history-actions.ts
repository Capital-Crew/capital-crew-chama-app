'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { revalidatePath } from 'next/cache'
import { WalletService } from '@/lib/services/WalletService'

/**
 * Get Contribution transaction history for a member
 */
export async function getContributionHistory(memberId: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const transactions = await prisma.shareTransaction.findMany({
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
 * This is different from Share Capital - it goes directly to withdrawable balance
 */
export async function addCashDeposit(input: {
    memberId: string
    amount: number
    description: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Validate amount
    if (input.amount <= 0) {
        throw new Error('Deposit amount must be greater than zero')
    }

    // Get member
    const member = await prisma.member.findUnique({
        where: { id: input.memberId }
    })

    if (!member) {
        throw new Error('Member not found')
    }

    // Get user for audit
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    // 0. Ensure Wallet Exists (Unique Account)
    const wallet = await WalletService.createWallet(input.memberId)

    // 0b. Get system mappings
    const mappings = await getSystemMappingsDict()

    // Post journal entry via AccountingEngine (it handles its own transaction)
    const journalEntry = await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: 'SAVINGS_DEPOSIT',
        referenceId: input.memberId,
        description: `Cash deposit - ${member.name}`,
        notes: input.description,
        lines: [
            {
                accountCode: mappings.CASH_ON_HAND, // Cash on Hand (DR - increase asset)
                debitAmount: input.amount,
                creditAmount: 0,
                description: 'Cash received'
            },
            {
                // Fix: Credit the specific wallet account
                accountId: wallet.glAccountId,
                debitAmount: 0,
                creditAmount: input.amount,
                description: `${member.name} deposit`
            }
        ],
        createdBy: session.user.id,
        createdByName: user?.member?.name || user?.name || (session.user.name as string) || 'System'
    })

    // Create audit log (separate from AccountingEngine's transaction)
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'WALLET_TRANSACTION_CREATED',
            details: `Cash deposit: ${member.name} - KES ${input.amount} - ${input.description}`
        }
    })

    revalidatePath('/wallet')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')

    return {
        success: true,
        journalEntryNumber: journalEntry.id // Use ID as number or short hash
    }
}
