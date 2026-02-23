import { db } from '@/lib/db'
import { Prisma, ReferenceType, SystemAccountType } from '@prisma/client'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { WalletService } from '@/lib/services/WalletService'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

/**
 * CollectionService
 * 
 * Central service for handling incoming payments (deposits, collections).
 * Decouples external provider callbacks from the core financial logic.
 */
export class CollectionService {

    /**
     * Process a M-Pesa deposit success
     * Called by M-Pesa direct STK Push callbacks.
     */
    static async processMpesaDeposit(params: {
        transactionId: string
        mpesaReceiptNumber: string
        phoneNumber: string
        amount: number
        memberId?: string
    }) {
        return await db.$transaction(async (tx) => {
            // 1. Resolve Member
            let member = null
            if (params.memberId) {
                member = await tx.member.findUnique({ where: { id: params.memberId } })
            }

            if (!member) {
                const memberContact = await tx.memberContact.findUnique({
                    where: { mobile: params.phoneNumber },
                    include: { member: true }
                })
                member = memberContact?.member || null
            }

            if (!member) {
                throw new Error(`Member not found for phone: ${params.phoneNumber}`)
            }

            // 2. Resolve Wallet
            const wallet = await WalletService.createWallet(member.id, tx)

            // 3. Resolve Accounting Mappings
            const mappings = await getSystemMappingsDict()
            const assetAccountCode = mappings[SystemAccountType.EVENT_CASH_DEPOSIT]

            const assetAccount = await tx.ledgerAccount.findUnique({
                where: { code: assetAccountCode }
            })

            if (!assetAccount) {
                throw new Error(`System Asset Account (${assetAccountCode}) not found.`)
            }

            // 4. Post Ledger Entry
            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: ReferenceType.SAVINGS_DEPOSIT,
                referenceId: params.transactionId,
                description: `M-Pesa Deposit: ${params.mpesaReceiptNumber}`,
                createdBy: "SYSTEM",
                createdByName: "M-Pesa Integration",
                externalReferenceId: params.mpesaReceiptNumber,
                lines: [
                    {
                        accountId: assetAccount.id,
                        debitAmount: params.amount,
                        creditAmount: 0,
                        description: `Cash Deposit from ${params.phoneNumber}`
                    },
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: 0,
                        creditAmount: params.amount,
                        description: `Credit to Wallet (${member.memberNumber})`
                    }
                ]
            }, tx)

            // 5. Get Balance After
            const updatedWalletGL = await tx.ledgerAccount.findUnique({
                where: { id: wallet.glAccountId }
            })
            const balanceAfter = updatedWalletGL?.balance || 0

            // 6. Create Wallet Transaction record
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    amount: params.amount,
                    balanceAfter: balanceAfter,
                    description: `Deposit via M-Pesa (${params.mpesaReceiptNumber})`
                }
            })

            return { success: true, balanceAfter }
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 20000
        })
    }

    /**
     * Process an IntaSend collection (Deposit)
     * Called by IntaSend webhooks.
     */
    static async processIntasendDeposit(params: {
        memberNumber: number
        amount: number
        providerRef: string
        checkoutRequestId: string
        phoneNumber: string
    }) {
        return await db.$transaction(async (tx) => {
            // 1. Resolve Wallet & Member
            const targetWallet = await tx.wallet.findFirst({
                where: { member: { memberNumber: params.memberNumber } },
                include: { member: true }
            })

            if (!targetWallet) {
                throw new Error(`Wallet not found for Member Number: ${params.memberNumber}`)
            }

            // 2. Idempotency Check
            const existingTx = await tx.transaction.findFirst({
                where: { mpesaReceiptNumber: params.providerRef }
            })

            if (existingTx && existingTx.status === 'COMPLETED') {
                return { success: true, duplicate: true }
            }

            // 3. Create/Update Transaction Record
            const mpesaTx = await tx.transaction.create({
                data: {
                    memberId: targetWallet.memberId,
                    amount: params.amount,
                    phoneNumber: params.phoneNumber,
                    status: 'COMPLETED',
                    checkoutRequestId: params.checkoutRequestId,
                    mpesaReceiptNumber: params.providerRef,
                }
            })

            // 4. Resolve Accounting Mappings
            const mappings = await getSystemMappingsDict()
            const assetAccountCode = mappings[SystemAccountType.EVENT_CASH_DEPOSIT]

            // 5. Post Ledger Entry
            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'SAVINGS_DEPOSIT',
                referenceId: mpesaTx.id,
                description: `M-Pesa Deposit - ${targetWallet.member.name}`,
                createdBy: 'SYSTEM',
                createdByName: 'IntaSend Webhook',
                externalReferenceId: mpesaTx.mpesaReceiptNumber || undefined,
                lines: [
                    {
                        accountCode: assetAccountCode,
                        debitAmount: params.amount,
                        creditAmount: 0,
                        description: `Deposit via M-Pesa ${mpesaTx.mpesaReceiptNumber}`
                    },
                    {
                        accountId: targetWallet.glAccountId,
                        debitAmount: 0,
                        creditAmount: params.amount,
                        description: 'Wallet Credit'
                    }
                ]
            }, tx)

            // 6. Create Wallet Transaction for statement
            // Get balance after JE
            const updatedWalletGL = await tx.ledgerAccount.findUnique({
                where: { id: targetWallet.glAccountId }
            })
            const balanceAfter = updatedWalletGL?.balance || 0

            await tx.walletTransaction.create({
                data: {
                    walletId: targetWallet.id,
                    type: 'DEPOSIT',
                    amount: params.amount,
                    balanceAfter: balanceAfter,
                    description: `Deposit via M-Pesa (${params.providerRef})`
                }
            })

            return { success: true, transactionId: mpesaTx.id }
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 20000
        })
    }
}
