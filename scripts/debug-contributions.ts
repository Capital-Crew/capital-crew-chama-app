
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Investigating Contribution Balance...')

    // 1. Get a member with transactions
    const member = await prisma.member.findFirst({
        include: {
            shareTransactions: true
        }
    })

    if (!member) {
        console.error('No member found')
        return
    }

    console.log(`Checking Member: ${member.name} (${member.id})`)

    // 2. Get Ledger Entries for Account 1200
    const account = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } })
    if (!account) { console.error('Account 1200 not found'); return; }

    console.log(`Account 1200 Type: ${account.type}`)

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerAccountId: account.id,
            // Filter by this member if possible? 
            // LedgerEntry doesn't link to member directly, need to trace back via Transaction -> Reference?
            // Or we can rely on `getAccountBalance` filtering logic if it exists.
        },
        include: { ledgerTransaction: true }
    })

    console.log(`Found ${entries.length} entries for Account 1200 globally.`)

    // 3. Inspect a sample entry
    if (entries.length > 0) {
        console.log('Sample Entry:', JSON.stringify(entries[0], null, 2))
    }

    // 4. Run Balance Calculation via Engine
    // We can't import the Engine easily in this script without complex setup, so we re-implement the math to check.

    let balance = 0
    for (const entry of entries) {
        // If EQUITY: Credit - Debit
        const debit = Number(entry.debitAmount)
        const credit = Number(entry.creditAmount)
        const net = credit - debit
        balance += net
    }

    console.log(`Calculated Global Contribution Balance (Equity Rules): ${balance}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
