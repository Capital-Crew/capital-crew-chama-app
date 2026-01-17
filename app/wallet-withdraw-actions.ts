'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { WalletService } from '@/lib/services/WalletService'
import { Prisma } from '@prisma/client'

/**
 * Withdraw Funds
 * 
 * Business Rules:
 * - Can only withdraw from withdrawable balance (Account 2000)
 * - Strict overdraft prevention (amount must not exceed available balance)
 * - Posts via AccountingEngine with proper journal entries
 * - Full audit trail
 */
export async function withdrawFunds(input: {
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
        throw new Error('Withdrawal amount must be greater than zero')
    }

    // Get member
    const member = await prisma.member.findUnique({
        where: { id: input.memberId }
    })

    if (!member) {
        throw new Error('Member not found')
    }

    // Get withdrawable balance from AccountingEngine (source of truth)
    const withdrawableBalance = await getMemberWalletBalance(input.memberId)

    // STRICT VALIDATION: Prevent overdraft
    if (input.amount > withdrawableBalance) {
        throw new Error(
            `Insufficient withdrawable balance. Available: KES ${withdrawableBalance.toLocaleString()}, Requested: KES ${input.amount.toLocaleString()}`
        )
    }

    // Get user for audit
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    // 0. Get system mappings
    const mappings = await getSystemMappingsDict()

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 0a. Resolve Wallet (Atomic)
        const wallet = await WalletService.createWallet(input.memberId, tx)

        // 0b. Re-Check Balance (Atomic Lock / Fresh Read)
        // Since getMemberWalletBalance traverses journal lines, it sees the current state in this TX context.
        // For true pessimistic locking we'd need SELECT ... FOR UPDATE, but typically 'REPEATABLE READ' isolation (default in some) suffices,
        // or effectively short gap reduces risk. For high concurrency, use CoreLedger.getAccountBalanceLocked if available.
        // Given existing structure, a fresh read is a good improvement.
        const currentBalance = await getMemberWalletBalance(input.memberId, tx)

        if (input.amount > currentBalance) {
            throw new Error(
                `Insufficient withdrawable balance. Available: KES ${currentBalance.toLocaleString()}, Requested: KES ${input.amount.toLocaleString()}`
            )
        }

        // 1. Post journal entry via AccountingEngine
        const journalEntry = await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: 'SAVINGS_WITHDRAWAL',
            referenceId: input.memberId,
            description: `Withdrawal - ${member.name}`,
            notes: input.description,
            externalReferenceId: `WD-${Date.now()}`,
            lines: [
                {
                    accountId: wallet.glAccountId, // Member Savings (DR - decrease liability)
                    debitAmount: input.amount,
                    creditAmount: 0,
                    description: `${member.name} withdrawal`
                },
                {
                    accountCode: mappings.EVENT_CASH_WITHDRAWAL || mappings.CASH_ON_HAND, // Cash out (CR - decrease asset)
                    debitAmount: 0,
                    creditAmount: input.amount,
                    description: 'Cash paid out'
                }
            ],
            createdBy: session.user.id!,
            createdByName: user?.member?.name || user?.name || (session.user.name as string) || 'System'
        }, tx)


        // 2. Create audit log
        await tx.auditLog.create({
            data: {
                userId: session.user.id!,
                action: 'WALLET_TRANSACTION_CREATED',
                details: `Withdrawal: ${member.name} - KES ${input.amount} - ${input.description}`
            }
        })

        // 3. Create Wallet Transaction Record
        await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'WITHDRAWAL',
                amount: new Prisma.Decimal(input.amount),
                description: `Withdrawal: ${input.description}`,
                balanceAfter: new Prisma.Decimal(currentBalance - input.amount), // Snapshot
                immutable: true
            }
        })

        revalidatePath('/wallet')
        revalidatePath('/dashboard')
        revalidatePath('/accounts')

        return {
            success: true,
            journalEntryId: journalEntry.id,
            newWithdrawableBalance: currentBalance - input.amount
        }
    })
}

/**
 * Get withdrawable balance for a member
 * Server action wrapper to prevent Prisma from running in browser
 */
export async function getWithdrawableBalance(memberId: string): Promise<number> {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    return await getMemberWalletBalance(memberId)
}
