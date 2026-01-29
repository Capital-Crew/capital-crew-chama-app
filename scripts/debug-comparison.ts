
import { calculateBorrowingPower } from '@/lib/utils/credit-limit'
import { getMemberContributionBalance } from '@/lib/accounting/AccountingEngine'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG COMPARISON ---')

    const sysAdmin = await prisma.member.findFirst({ where: { name: 'System Administrator' } })
    if (!sysAdmin) return

    console.log(`Member: ${sysAdmin.name} (${sysAdmin.id})`)

    // 1. Direct Engine Call
    try {
        const balance = await getMemberContributionBalance(sysAdmin.id)
        console.log(`[Direct] getMemberContributionBalance: ${balance}`)
    } catch (e) {
        console.error('[Direct] Error:', e)
    }

    // 2. Borrowing Power Call
    try {
        const snapshot = await calculateBorrowingPower(sysAdmin.id)
        console.log(`[Wrapper] calculateBorrowingPower shareCapital: ${snapshot.shareCapital}`)
    } catch (e) {
        console.error('[Wrapper] Error:', e)
    }

    // 3. Dump Raw Entries
    const mappings = await prisma.systemAccountingMapping.findUnique({ where: { type: 'CONTRIBUTIONS' }, include: { account: true } })
    if (!mappings) return

    console.log(`\n--- Raw Entries for Account ${mappings.account.code} ---`)
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerAccountId: mappings.account.id,
            ledgerTransaction: {
                referenceId: sysAdmin.id
            }
        },
        include: { ledgerTransaction: true }
    })

    let net = 0
    entries.forEach(e => {
        const debit = Number(e.debitAmount)
        const credit = Number(e.creditAmount)
        net += (credit - debit) // Equity Logic
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString().substring(0, 19)}] ${e.ledgerTransaction.description} | DR: ${debit} CR: ${credit} | Net: ${net}`)
        console.log(`   RefType: ${e.ledgerTransaction.referenceType}, Reversal: ${e.ledgerTransaction.isReversed}`)
    })
    console.log(`Final Net Calculation: ${net}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
