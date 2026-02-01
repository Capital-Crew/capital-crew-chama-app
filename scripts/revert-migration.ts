
import { db } from '@/lib/db'

async function main() {
    const txId = 'cml3k513u0000tmm03xagmq18'
    console.log(`Reverting transaction ${txId}...`)

    await db.$transaction(async (tx) => {
        // 1. Get the transaction
        const transaction = await tx.ledgerTransaction.findUnique({
            where: { id: txId },
            include: { ledgerEntries: true }
        })

        if (!transaction) {
            console.log("Transaction not found (already deleted?)")
            return
        }

        // 2. Reverse Balances
        for (const entry of transaction.ledgerEntries) {
            // If it was a debit, we credit the account balance to reverse it?
            // Wait, account balance update logic:
            // Asset/Expense: Bal = Debit - Credit.
            // Liability/Equity/Rev: Bal = Credit - Debit.

            // In migration:
            // Equity (3000): Debit 89100. (Equity Bal = Cred - Deb). So Balance decreased by 89100.
            // Asset (1200): Credit 89100. (Asset Bal = Deb - Cred). So Balance decreased by 89100.

            // To Reverse:
            // We need to INCREASE the balances back.

            const account = await tx.ledgerAccount.findUnique({ where: { id: entry.ledgerAccountId } })
            if (!account) continue

            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                // Was Credit 89100. Need to add 89100.
                if (Number(entry.creditAmount) > 0) {
                    await tx.ledgerAccount.update({
                        where: { id: account.id },
                        data: { balance: { increment: entry.creditAmount } }
                    })
                }
                // Was Debit. Need to remove.
                if (Number(entry.debitAmount) > 0) {
                    await tx.ledgerAccount.update({
                        where: { id: account.id },
                        data: { balance: { decrement: entry.debitAmount } }
                    })
                }
            } else {
                // Liability/Equity
                // Was Debit 89100. Need to add 89100.
                if (Number(entry.debitAmount) > 0) {
                    await tx.ledgerAccount.update({
                        where: { id: account.id },
                        data: { balance: { increment: entry.debitAmount } }
                    })
                }
                if (Number(entry.creditAmount) > 0) {
                    await tx.ledgerAccount.update({
                        where: { id: account.id },
                        data: { balance: { decrement: entry.creditAmount } }
                    })
                }
            }
        }

        // 3. Delete Transaction and Entries
        await tx.ledgerEntry.deleteMany({ where: { ledgerTransactionId: txId } })
        await tx.ledgerTransaction.delete({ where: { id: txId } })

        console.log("Reverted successfully.")
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect())
