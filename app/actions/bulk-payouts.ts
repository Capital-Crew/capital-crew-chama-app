'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { BatchPaymentStatus, AuditLogAction, SystemAccountType } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
import { getSystemMappingsDict } from './system-accounting'

const prisma = db

export type BulkPayoutItem = {
    memberId: string
    amount: number
}

/**
 * Process a Bulk Payout (Dividends, Interest, etc.)
 * 
 * Logic:
 * 1. Create BatchPayment record
 * 2. For each member:
 *    - Credit their Wallet (via GL + WalletTransaction + BatchItem)
 *    - Debit the Dividend/Interest Source Account
 * 3. Log results
 */
export async function processBulkPayout(
    title: string,
    type: 'DIVIDEND' | 'INTEREST' | 'BONUS',
    sourceAccountId: string, // The Expense/Equity account to Debit (e.g. Dividends Payable)
    payoutList: BulkPayoutItem[]
): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    if (!payoutList.length) return serializeFinancials({ success: false, error: "No payouts to process" })

    // Calculate Grand Total
    const grandTotal = payoutList.reduce((sum, item) => sum + item.amount, 0)

    try {
        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')

        // We use a high timeout for bulk processing
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Batch Header
            const batch = await tx.batchPayment.create({
                data: {
                    title,
                    type,
                    totalAmount: new Decimal(grandTotal),
                    status: BatchPaymentStatus.PROCESSING,
                    createdById: session.user.id!
                }
            })

            let successCount = 0
            let failCount = 0
            const errors: string[] = []

            // 2. Process Items
            for (const item of payoutList) {
                try {
                    // Find Member's Wallet
                    const wallet = await tx.wallet.findUnique({
                        where: { memberId: item.memberId },
                        include: { glAccount: true }
                    })

                    if (!wallet || !wallet.glAccount) {
                        throw new Error(`Member ${item.memberId} has no wallet`)
                    }

                    const amount = Number(item.amount)

                    // POST JOURNAL ENTRY
                    // DR Source Account (Equity/Expense)
                    // CR Member Wallet (Liability)
                    await AccountingEngine.postJournalEntry({
                        transactionDate: new Date(),
                        referenceType: 'BULK_PAYOUT', // Use newly added enum value
                        referenceId: batch.id, // Linking all JEs to the Batch ID
                        description: `${type} Payout: ${title} - Member ${item.memberId}`,
                        createdBy: session.user.id!,
                        createdByName: session.user.name || 'Admin',
                        lines: [
                            {
                                accountId: sourceAccountId,
                                debitAmount: amount,
                                creditAmount: 0,
                                description: `${type} Distribution`
                            },
                            {
                                accountId: wallet.glAccountId,
                                debitAmount: 0,
                                creditAmount: amount,
                                description: `Credit ${type}`
                            }
                        ]
                    }, tx)

                    // Wallet Transaction (Display only, balance via GL)
                    const wTx = await tx.walletTransaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'DIVIDEND_PAYOUT', // Or make dynamic if needed
                            amount: new Decimal(amount),
                            description: `${type}: ${title}`,
                            balanceAfter: 0, // Placeholder
                            immutable: true
                        }
                    })

                    // Batch Item (Tracking)
                    await tx.batchItem.create({
                        data: {
                            batchId: batch.id,
                            memberId: item.memberId,
                            amount: new Decimal(amount),
                            status: 'PAID',
                            walletTransactionId: wTx.id
                        }
                    })

                    successCount++

                } catch (err: any) {
                    failCount++
                    errors.push(`Member ${item.memberId}: ${err.message}`)

                    // Log failure in BatchItem
                    await tx.batchItem.create({
                        data: {
                            batchId: batch.id,
                            memberId: item.memberId,
                            amount: new Decimal(item.amount),
                            status: 'FAILED',
                            error: err.message
                        }
                    })
                }
            }

            // 3. Complete Batch
            await tx.batchPayment.update({
                where: { id: batch.id },
                data: {
                    status: (failCount === 0) ? 'COMPLETED' : (successCount > 0 ? 'COMPLETED' : 'FAILED'), // Allow partial completion? For now, yes.
                    processedAt: new Date(),
                    description: failCount > 0 ? `Finished with ${failCount} errors: ${errors.slice(0, 3).join(', ')}...` : null
                }
            })

            return { batch, successCount, failCount, errors }
        }, {
            timeout: 60000 // 60s timeout for transaction
        })

        return serializeFinancials({ success: true, data: result })

    } catch (error: any) {
        console.error("Bulk payout failed:", error)
        return serializeFinancials({ success: false, error: error.message })
    }
}
