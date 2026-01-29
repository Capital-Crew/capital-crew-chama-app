
import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

async function main() {
    console.log('Recalculating Ledger Account Balances...')

    // Fetch accounts
    const accounts = await prisma.ledgerAccount.findMany()

    for (const account of accounts) {
        // Fetch all lines
        const lines = await prisma.ledgerEntry.findMany({
            where: { ledgerAccountId: account.id }
        })

        let balance = new Decimal(0)
        let debitTotal = new Decimal(0)
        let creditTotal = new Decimal(0)

        for (const line of lines) {
            const deb = new Decimal(line.debitAmount)
            const cred = new Decimal(line.creditAmount)

            debitTotal = debitTotal.plus(deb)
            creditTotal = creditTotal.plus(cred)

            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                // Asset: DR increases, CR decreases
                balance = balance.plus(deb).minus(cred)
            } else {
                // Equity/Liability/Income: CR increases, DR decreases
                balance = balance.plus(cred).minus(deb)
            }
        }

        console.log(`Account ${account.code} (${account.type}):`)
        console.log(`  Lines: ${lines.length}`)
        console.log(`  Old Balance: ${account.balance}`)
        console.log(`  New Balance: ${balance}`)

        if (balance.toFixed(2) !== new Decimal(account.balance).toFixed(2)) {
            console.log('  -> UPDATING...')
            await prisma.ledgerAccount.update({
                where: { id: account.id },
                data: { balance: balance }
            })
            console.log('  -> DONE')
        } else {
            console.log('  -> OK')
        }
        console.log('---')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
