
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for Members with Negative Cache...')

    const members = await prisma.member.findMany({
        where: {
            shareContributions: { lt: 0 }
        },
        select: {
            id: true,
            name: true,
            shareContributions: true
        }
    })

    console.log(`Found ${members.length} members with negative shareContributions.`)
    if (members.length > 0) {
        console.table(members)
    }

    // Also check for mismatch between Cache and Ledger
    // For the first 5 members
    const sampleMembers = await prisma.member.findMany({ take: 5 })

    // We need to fetch ledger balance manually here to compare
    const contribAccount = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' }, include: { account: true }
    })

    if (!contribAccount) {
        console.log('No Contribution Mapping found.')
        return
    }

    console.log('\nVerifying Cache vs Ledger:')
    for (const m of sampleMembers) {
        const aggs = await prisma.ledgerEntry.aggregate({
            where: {
                ledgerAccountId: contribAccount.account.id,
                ledgerTransaction: {
                    referenceId: m.id
                }
            },
            _sum: { creditAmount: true, debitAmount: true }
        })
        const ledgerBal = Number(aggs._sum.creditAmount || 0) - Number(aggs._sum.debitAmount || 0)

        console.log(`Member: ${m.name}`)
        console.log(`  Cache: ${m.shareContributions}`)
        console.log(`  Ledger: ${ledgerBal}`)

        if (Number(m.shareContributions) !== ledgerBal) {
            console.log('  -> MISMATCH DETECTED')
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
