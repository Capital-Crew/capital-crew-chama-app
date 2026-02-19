import { db as prisma } from '@/lib/db'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { WalletStatus, Prisma } from '@prisma/client'

export class WalletService {
    /**
     * Create a new wallet for a member, including the underlying GL Account.
     * Enforces 1:1 Member-Wallet relationship.
     */
    static async createWallet(memberId: string, externalTx?: Prisma.TransactionClient) {
        const client = externalTx || prisma

        const member = await client.member.findUnique({
            where: { id: memberId }
        })

        if (!member) {
            throw new Error('Member not found')
        }

        // Check if wallet exists
        const existingWallet = await client.wallet.findUnique({
            where: { memberId }
        })

        if (existingWallet) {
            return existingWallet
        }

        const runInTransaction = async (tx: Prisma.TransactionClient) => {
            // 1. Get Parent Account (MEMBER_WALLET Control Account)
            const mapping = await tx.systemAccountingMapping.findUnique({
                where: { type: 'MEMBER_WALLET' }
            })
            const parentId = mapping?.accountId

            // 2. Create Liability Ledger Account
            // Naming convention: "Wallet - {MemberName} ({MemberNumber})"
            const accountCode = `WAL-${member.memberNumber.toString().padStart(6, '0')}`

            const glAccount = await tx.ledgerAccount.create({
                data: {
                    code: accountCode,
                    name: `Wallet - ${member.name}`,
                    type: 'LIABILITY',
                    isActive: true,
                    allowManualEntry: false,
                    parentId: parentId // Link as Sub-Account
                }
            })

            // 2. Create Wallet Record
            const wallet = await tx.wallet.create({
                data: {
                    memberId,
                    glAccountId: glAccount.id,
                    accountRef: accountCode, // Using same code as Paybill Ref
                    status: 'ACTIVE',
                    currency: 'KES'
                }
            })

            return wallet
        }

        if (externalTx) {
            return await runInTransaction(externalTx)
        } else {
            return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                return await runInTransaction(tx)
            })
        }
    }
    /**
     * Get the real-time wallet balance from the Ledger.
     */
    static async getWalletBalance(memberId: string): Promise<number> {
        return await getMemberWalletBalance(memberId)
    }

    /**
     * Find wallet by Account Reference (Paybill)
     */
    static async getWalletByAccountRef(accountRef: string) {
        return await prisma.wallet.findUnique({
            where: { accountRef }
        })
    }
}
