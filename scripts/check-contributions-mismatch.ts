
import { db } from '@/lib/db'

async function main() {
    console.log("Checking for Contributions Mismatches...")

    // 1. Get all members with their legacy share contributions
    const members = await db.member.findMany({
        select: {
            id: true,
            name: true,
            memberNumber: true,
            shareContributions: true
        }
    })

    console.log(`Found ${members.length} members.`)
    console.log("---------------------------------------------------")
    console.log("Member | Current (Col) | Ledger (1200) | Diff | Status")
    console.log("---------------------------------------------------")

    let mismatchCount = 0

    for (const m of members) {
        // Calculate Ledger Sum (Credits to 1200)
        // matches the logic in member-dashboard-actions.ts
        const ledgerResult = await db.ledgerEntry.aggregate({
            _sum: { creditAmount: true },
            where: {
                ledgerAccount: { code: '1200' },
                ledgerTransaction: {
                    referenceId: m.id,
                    isReversed: false
                    // Note: Intentionally NOT filtering by referenceType yet to see ALL traffic
                }
            }
        })

        const ledgerRaw = Number(ledgerResult._sum.creditAmount || 0n)
        const legacyVal = Number(m.shareContributions || 0)

        const diff = ledgerRaw - legacyVal

        if (Math.abs(diff) > 1) { // Tolerate 1 unit diff
            console.log(`${m.memberNumber} | ${legacyVal.toFixed(2).padStart(10)} | ${ledgerRaw.toFixed(2).padStart(10)} | ${diff.toFixed(2).padStart(6)} | MISMATCH`)
            mismatchCount++

            // Deep dive into this member's ledger entries
            const entries = await db.ledgerEntry.findMany({
                where: {
                    ledgerAccount: { code: '1200' },
                    ledgerTransaction: { referenceId: m.id }
                },
                include: { ledgerTransaction: true }
            });

            if (entries.length > 0) {
                console.log(`    > Detail: Found ${entries.length} entries for ${m.memberNumber}:`)
                entries.forEach(e => {
                    console.log(`      - ${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]} | ${e.ledgerTransaction.referenceType} | ${Number(e.creditAmount)}`)
                })
            } else {
                console.log(`    > Detail: No ledger entries found.`)
            }

        } else if (legacyVal > 0 || ledgerRaw > 0) {
            // console.log(`${m.memberNumber} | ${legacyVal} | ${ledgerRaw} | OK`)
        }
    }

    console.log("---------------------------------------------------")
    console.log(`Total Mismatches: ${mismatchCount}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect())
