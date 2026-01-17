
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Running DESTRUCTIVE purge of non-core ledgers...')

    const coreCodes = ['1000', '1200', '2000', '3000', '4000']

    // Get Core IDs for remapping
    const coreAccounts = await prisma.ledgerAccount.findMany({
        where: { code: { in: coreCodes } },
        select: { code: true, id: true }
    })

    const liabilitiesId = coreAccounts.find(a => a.code === '2000')?.id
    const incomeId = coreAccounts.find(a => a.code === '4000')?.id

    if (!liabilitiesId || !incomeId) {
        throw new Error('Core accounts 2000 or 4000 not found. Cannot safely remap dependencies.')
    }

    // Identify Targets
    const targets = await prisma.ledgerAccount.findMany({
        where: { code: { notIn: coreCodes } },
        select: { id: true, name: true, code: true }
    })

    const targetIds = targets.map(t => t.id)
    console.log(`Targeting ${targets.length} accounts for deletion.`)

    if (targetIds.length === 0) {
        console.log('No accounts to delete.')
        return
    }

    // 1. Delete Transactions (History)
    // Find all transactions that involve these accounts
    const transactions = await prisma.ledgerTransaction.findMany({
        where: {
            ledgerEntries: {
                some: { ledgerAccountId: { in: targetIds } }
            }
        },
        select: { id: true }
    })

    const transactionIds = transactions.map(t => t.id)
    console.log(`Deleting ${transactionIds.length} transactions involving target accounts...`)

    // Delete in batches to avoid huge queries if necessary, but here simple deleteMany usually works
    if (transactionIds.length > 0) {
        // First delete entries (Cascade usually handles this from Transaction, but being explicit)
        await prisma.ledgerEntry.deleteMany({
            where: { ledgerTransactionId: { in: transactionIds } }
        })

        await prisma.ledgerTransaction.deleteMany({
            where: { id: { in: transactionIds } }
        })
    }

    // 2. Clear System Mappings
    const sysMapResult = await prisma.systemAccountingMapping.deleteMany({
        where: { accountId: { in: targetIds } }
    })
    console.log(`Deleted ${sysMapResult.count} system mappings.`)

    // 3. Clear/Remap Product Mappings
    const prodMapResult = await prisma.productAccountingMapping.deleteMany({
        where: { accountId: { in: targetIds } }
    })
    console.log(`Deleted ${prodMapResult.count} product mappings.`)

    // 4. Remap Wallets (Structural Dependency)
    // 4. Delete Wallets (Structural Dependency)
    // First delete WalletTransactions
    const walletTransactionsDelete = await prisma.walletTransaction.deleteMany({
        where: { wallet: { glAccountId: { in: targetIds } } }
    })
    console.log(`Deleted ${walletTransactionsDelete.count} wallet transactions.`)

    const walletResult = await prisma.wallet.deleteMany({
        where: { glAccountId: { in: targetIds } }
    })
    console.log(`Deleted ${walletResult.count} test wallets.`)

    // 5. Remap/Delete Expenses
    const expenseResult = await prisma.expense.deleteMany({
        where: { expenseAccountId: { in: targetIds } }
    })
    console.log(`Deleted ${expenseResult.count} expenses linked to deleted accounts.`)

    // 6. Transfers
    await prisma.transferRequest.deleteMany({
        where: {
            OR: [
                { debitAccountId: { in: targetIds } },
                { creditAccountId: { in: targetIds } }
            ]
        }
    })
    console.log('Deleted transfer requests involving target accounts.')

    // 7. WelfareTypes
    // Remap to Liabilities
    await prisma.welfareType.updateMany({
        where: { glAccountId: { in: targetIds } },
        data: { glAccountId: liabilitiesId }
    })
    console.log('Remapped Welfare Types to LIABILITIES.')

    // 8. Finally, Delete Accounts
    const deleteResult = await prisma.ledgerAccount.deleteMany({
        where: { id: { in: targetIds } }
    })

    console.log(`✅ Successfully deleted ${deleteResult.count} accounts.`)
    console.log('The system now contains ONLY the 5 core ledgers.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
