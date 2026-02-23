'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { BatchPaymentStatus, AuditLogAction } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
import { revalidatePath } from 'next/cache'

const prisma = db

export type BulkPayoutItem = {
    memberId: string
    amount: number
}

/**
 * Process a Bulk Payout (Dividends, Interest, etc.)
 * 
 * Performance Optimized: Moves loop outside the primary transaction to prevent
 * excessive table locking. Each payout is processed in its own atomic transaction.
 */
export async function processBulkPayout(
    title: string,
    type: 'DIVIDEND' | 'INTEREST' | 'BONUS',
    sourceAccountId: string,
    payoutList: BulkPayoutItem[]
): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!payoutList.length) return serializeFinancials({ success: false, error: "No payouts to process" })

    const grandTotal = payoutList.reduce((sum, item) => sum + item.amount, 0)

    try {
        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')

        // 1. Create Batch Header (Initial state)
        const batch = await prisma.batchPayment.create({
            data: {
                title,
                type,
                totalAmount: new Decimal(grandTotal),
                status: BatchPaymentStatus.PROCESSING,
                createdById: session.user.id
            }
        })

        let successCount = 0
        let failCount = 0
        const errors: string[] = []

        // 2. Process Items Individually (Decoupled Transactions)
        for (const item of payoutList) {
            try {
                await prisma.$transaction(async (tx) => {
                    const wallet = await tx.wallet.findUnique({
                        where: { memberId: item.memberId },
                        include: { glAccount: true }
                    })

                    if (!wallet || !wallet.glAccount) {
                        throw new Error(`Member ${item.memberId} has no wallet`)
                    }

                    const amount = Number(item.amount)

                    // POST JOURNAL ENTRY (DR Source, CR Member Wallet)
                    await AccountingEngine.postJournalEntry({
                        transactionDate: new Date(),
                        referenceType: 'BULK_PAYOUT',
                        referenceId: batch.id,
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

                    // Get Balance After
                    const updatedWalletGL = await tx.ledgerAccount.findUnique({
                        where: { id: wallet.glAccountId }
                    })
                    const balanceAfter = updatedWalletGL?.balance || 0

                    // Wallet Transaction record
                    const wTx = await tx.walletTransaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'DIVIDEND_PAYOUT',
                            amount: new Decimal(amount),
                            description: `${type}: ${title}`,
                            balanceAfter: balanceAfter,
                            immutable: true
                        }
                    })

                    // Batch Item Tracking
                    await tx.batchItem.create({
                        data: {
                            batchId: batch.id,
                            memberId: item.memberId,
                            amount: new Decimal(amount),
                            status: 'PAID',
                            walletTransactionId: wTx.id
                        }
                    })
                }, { timeout: 10000 })

                successCount++
            } catch (err: any) {
                failCount++
                console.error(`Bulk payout item failed for member ${item.memberId}:`, err.message)
                errors.push(`Member ${item.memberId}: ${err.message}`)

                // Record Failure (Outside the item transaction if it failed)
                await prisma.batchItem.create({
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

        // 3. Complete Batch Header
        const finalStatus = (failCount === 0) ? BatchPaymentStatus.COMPLETED : (successCount > 0 ? BatchPaymentStatus.COMPLETED : BatchPaymentStatus.FAILED)

        await prisma.batchPayment.update({
            where: { id: batch.id },
            data: {
                status: finalStatus,
                processedAt: new Date(),
                description: failCount > 0 ? `Finished with ${failCount} errors. First error: ${errors[0]}` : null
            }
        })

        revalidatePath('/admin/payouts')
        return serializeFinancials({ success: true, data: { batchId: batch.id, successCount, failCount, errors } })

    } catch (error: any) {
        console.error("Bulk payout orchestration failed:", error)
        return serializeFinancials({ success: false, error: error.message })
    }
}
