import { db as prisma } from '@/lib/db'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { WalletService } from './WalletService'
import { SystemAccountType, ReferenceType, WalletTransactionType, Prisma } from '@prisma/client'

export class WithdrawalService {
    /**
     * Process a withdrawal request.
     * 1. Check Balance.
     * 2. Post Ledger Entry (Debit Wallet, Credit Bank).
     * 3. Record Wallet Transaction.
     */
    static async processWithdrawal(memberId: string, amount: number, reference: string): Promise<string> {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Get Wallet
            const wallet = await tx.wallet.findUnique({
                where: { memberId },
                include: { glAccount: true }
            })

            if (!wallet) throw new Error('Wallet not found')
            if (wallet.status !== 'ACTIVE') throw new Error('Wallet is not active')

            // 2. Check Balance
            // We can get the balance from the Ledger Account directly
            const currentBalance = await AccountingEngine.getAccountBalance(wallet.glAccount.code, undefined, undefined, tx)

            if (currentBalance < amount) {
                throw new Error(`Insufficient funds. Current Balance: ${currentBalance}, Requested: ${amount}`)
            }

            // 3. Resolve System Account for Cash/Bank (Asset)
            const bankAccountMapping = await tx.systemAccountingMapping.findUnique({
                where: { type: 'EVENT_CASH_WITHDRAWAL' } // Using SPECIFIC type if exists, else CASH_DEPOSIT reversed?
                // Using 'EVENT_CASH_WITHDRAWAL' based on Schema Analysis.
            })

            // Fallback or Error
            // Schema had EVENT_CASH_WITHDRAWAL in SystemAccountType. 
            // If mapping missing, throw.
            if (!bankAccountMapping) {
                // Try generic bank account if specific withdrawal one not set?
                // Ideally throwing error forces config.
                throw new Error("System Account for 'EVENT_CASH_WITHDRAWAL' not configured.")
            }

            const bankAccountId = bankAccountMapping.accountId

            // 4. Post Ledger Entry
            // Debit: Member Wallet (Liability) - Decrease Liability
            // Credit: Bank (Asset) - Decrease Asset
            const ledgerTx = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: ReferenceType.SAVINGS_WITHDRAWAL,
                referenceId: reference,
                description: `Withdrawal: ${reference}`,
                createdBy: 'SYSTEM',
                createdByName: 'Withdrawal Service',
                lines: [
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: amount, // Debit Liability -> Decrease Balance
                        creditAmount: 0,
                        description: 'Withdrawal from Wallet'
                    },
                    {
                        accountId: bankAccountId,
                        debitAmount: 0,
                        creditAmount: amount, // Credit Asset -> Decrease Cash
                        description: 'Cash Withdrawal Payout'
                    }
                ]
            }, tx) // Pass tx

            // 5. Create Wallet Transaction Record (For View)
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: WalletTransactionType.WITHDRAWAL,
                    amount: new Prisma.Decimal(amount), // Decimal type
                    description: `Withdrawal Ref: ${reference}`,
                    balanceAfter: new Prisma.Decimal(Number(currentBalance) - Number(amount)), // Snapshot
                    immutable: true
                }
            })

            return ledgerTx.id || ledgerTx
        })
    }
}
