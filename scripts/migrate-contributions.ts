import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

async function main() {
    console.log('\n=== Starting Contribution Migration (1200 -> 3011) ===\n')

    // 1. Fetch Accounts
    const acc1200 = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } })
    const acc3011 = await prisma.ledgerAccount.findUnique({ where: { code: '3011' } })

    if (!acc1200 || !acc3011) {
        console.error('❌ Could not find Accounts 1200 and/or 3011')
        process.exit(1)
    }

    // 2. Find all entries in 1200
    // We must group by LedgerTransaction.referenceId (which holds the memberId)
    const entries1200 = await prisma.ledgerEntry.findMany({
        where: {
            ledgerAccountId: acc1200.id,
            ledgerTransaction: {
                referenceId: { not: '' }
            }
        },
        include: {
            ledgerTransaction: true
        }
    })

    // Manual aggregation by memberId (referenceId)
    const memberBalances = new Map<string, Decimal>()

    for (const entry of entries1200) {
        // Skip reversals or invalid references
        if (!entry.ledgerTransaction || !entry.ledgerTransaction.referenceId) continue

        const memberId = entry.ledgerTransaction.referenceId
        const credit = new Decimal(entry.creditAmount.toString() || '0')
        const debit = new Decimal(entry.debitAmount.toString() || '0')
        const net = credit.minus(debit) // Equity/Liability normal balance is Credit

        if (!memberBalances.has(memberId)) {
            memberBalances.set(memberId, new Decimal(0))
        }
        memberBalances.set(memberId, memberBalances.get(memberId)!.plus(net))
    }

    // Filter to only positive balances
    const membersToMigrate = Array.from(memberBalances.entries())
        .map(([memberId, balance]) => ({ memberId, balance: balance.toNumber() }))
        .filter(m => m.balance > 0)

    console.log(`Found ${membersToMigrate.length} members with positive contribution balances in 1200`)

    if (membersToMigrate.length === 0) {
        console.log('No migration needed.')
        process.exit(0)
    }

    let totalMigrated = 0

    // 3. Migrate balances via Journal Entries
    for (const mb of membersToMigrate) {
        const { memberId, balance } = mb
        totalMigrated += balance

        console.log(`Migrating KES ${balance.toLocaleString()} for member ${memberId}`)

        // Create a formal Journal Entry to move funds
        await prisma.$transaction(async (tx) => {
            const txDate = new Date()

            const journalEntry = await tx.ledgerTransaction.create({
                data: {
                    transactionDate: txDate,
                    referenceType: 'SHARE_CONTRIBUTION',
                    referenceId: memberId,
                    description: `Migrating historical contributions from 1200 to 3011`,
                    notes: `System migration approved by admin`,
                    createdBy: 'SYSTEM',
                    createdByName: 'System Admin',
                    status: 'POSTED',
                    totalAmount: balance,
                    ledgerEntries: {
                        create: [
                            {
                                ledgerAccountId: acc1200.id,
                                debitAmount: balance, // Debit 1200 (decrease Equity/Liability)
                                creditAmount: 0,
                                description: 'Migration Transfer Out to 3011'
                            },
                            {
                                ledgerAccountId: acc3011.id,
                                debitAmount: 0,
                                creditAmount: balance, // Credit 3011 (increase Liability - Non-Withdrawable Deposits)
                                description: 'Migration Transfer In from 1200'
                            }
                        ]
                    }
                }
            })

            // Update Account Balances directly for this transaction
            await tx.ledgerAccount.update({
                where: { id: acc1200.id },
                data: { balance: { decrement: balance } }
            })

            await tx.ledgerAccount.update({
                where: { id: acc3011.id },
                data: { balance: { increment: balance } }
            })
        })
    }

    // Ensure mapping is pointing to 3011
    await prisma.systemAccountingMapping.upsert({
        where: { type: 'CONTRIBUTIONS' },
        update: { accountId: acc3011.id },
        create: { type: 'CONTRIBUTIONS', accountId: acc3011.id }
    })

    console.log(`\n✅ Migration Complete. Total moved: KES ${totalMigrated.toLocaleString()} across ${membersToMigrate.length} members.`)
}

main()
    .catch(e => { console.error('Migration failed:', e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
