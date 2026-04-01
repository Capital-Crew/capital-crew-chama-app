import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log('--- DEDUPLICATING BALANCE B/F ENTRIES ---')

    // Find all loans with more than one Balance B/F entry
    const allBFEntries = await db.loanTransaction.findMany({
        where: {
            description: { contains: 'Balance B/F' }
        },
        orderBy: { transactionDate: 'asc' }, // oldest first
        select: {
            id: true,
            loanId: true,
            transactionDate: true,
            description: true,
            loan: { select: { loanApplicationNumber: true } }
        }
    })

    // Group by loanId
    const byLoan: Record<string, typeof allBFEntries> = {}
    for (const entry of allBFEntries) {
        if (!byLoan[entry.loanId]) byLoan[entry.loanId] = []
        byLoan[entry.loanId].push(entry)
    }

    let fixed = 0
    for (const [loanId, entries] of Object.entries(byLoan)) {
        if (entries.length <= 1) {
            console.log(`✅ Loan ${entries[0].loan.loanApplicationNumber}: only 1 B/F entry, no action needed`)
            continue
        }

        // Keep the oldest (earliest transactionDate), delete the rest
        const toKeep = entries[0] // already sorted by asc date
        const toDelete = entries.slice(1)

        console.log(`⚠️  Loan ${toKeep.loan.loanApplicationNumber}: ${entries.length} B/F entries found`)
        console.log(`   Keeping: ${toKeep.transactionDate.toISOString().split('T')[0]} (ID: ${toKeep.id})`)

        for (const dup of toDelete) {
            await db.loanTransaction.delete({ where: { id: dup.id } })
            console.log(`   🗑️  Deleted duplicate: ${dup.transactionDate.toISOString().split('T')[0]} (ID: ${dup.id})`)
            fixed++
        }
    }

    if (fixed === 0) {
        console.log('✅ No duplicates found.')
    } else {
        console.log(`\n✅ Removed ${fixed} duplicate B/F entry(s).`)
    }

    console.log('--- DONE ---')
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
