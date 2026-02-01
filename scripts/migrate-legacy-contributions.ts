
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

async function main() {
    console.log("🚀 Starting Legacy Contribution Migration...")

    // 1. Ensure Opening Balance Equity Account (3000) exists
    let equityAccount = await db.ledgerAccount.findUnique({ where: { code: '3000' } })
    if (!equityAccount) {
        console.log("Creating Account 3000 - Opening Balance Equity...")
        equityAccount = await db.ledgerAccount.create({
            data: {
                code: '3000',
                name: 'Opening Balance Equity',
                type: 'EQUITY',
                description: 'System migration opening balances'
            }
        })
    }
    const equityAccountId = equityAccount.id

    // 2. Get Contributions Account (1200)
    const contribAccount = await db.ledgerAccount.findUnique({ where: { code: '1200' } })
    if (!contribAccount) throw new Error("Account 1200 not found!")
    const contribAccountId = contribAccount.id

    // 3. Find Mismatches
    const members = await db.member.findMany({
        select: {
            id: true,
            name: true,
            memberNumber: true,
            shareContributions: true
        }
    })

    let migratedCount = 0

    for (const m of members) {
        // Calculate Ledger Sum (Credits to 1200)
        const ledgerResult = await db.ledgerEntry.aggregate({
            _sum: { creditAmount: true },
            where: {
                ledgerAccount: { code: '1200' },
                ledgerTransaction: {
                    referenceId: m.id,
                    isReversed: false
                }
            }
        })

        const ledgerRaw = Number(ledgerResult._sum.creditAmount || 0n) / 100
        const legacyVal = Number(m.shareContributions || 0)

        // If Legacy > Ledger, we need to top up the ledger
        const diff = legacyVal - ledgerRaw

        if (diff > 1) { // Threshold 1.00
            console.log(`Migrating ${m.memberNumber}: Legacy=${legacyVal}, Ledger=${ledgerRaw}, Diff=${diff}`)

            await db.$transaction(async (tx) => {
                // Create Transaction
                const transaction = await tx.ledgerTransaction.create({
                    data: {
                        transactionDate: new Date(), // Now
                        referenceType: 'OPENING_BALANCE',
                        referenceId: m.id,
                        description: `Opening Balance Migration - ${m.memberNumber}`,
                        totalAmount: new Prisma.Decimal(diff),
                        createdBy: 'SYSTEM',
                        createdByName: 'Migration Script',
                        ledgerEntries: {
                            create: [
                                // DEBIT: Equity (3000) - Reducing Equity? 
                                // Wait, usually Opening Balances are Credits to Equity.
                                // If we CREDIT Asset 1200 (Contributions), we are increasing the Member's Stake (Liability/Equity side relative to member).
                                // So we need to DEBIT something.
                                // If we Debit Equity 3000, we are reducing Sacco Equity? 
                                // Actually, "Member Contributions" are a Liability for the Sacco.
                                // So 1200 (Asset) acting as Liability is weird. 
                                // But strictly enforcing double entry:
                                // CR 1200 (Contributions) -> correct per our model.
                                // DR 3000 (Equity) -> Balancing.
                                {
                                    ledgerAccountId: equityAccountId,
                                    debitAmount: new Prisma.Decimal(diff),
                                    creditAmount: 0,
                                    description: 'Opening Balance Offset'
                                },
                                {
                                    ledgerAccountId: contribAccountId,
                                    debitAmount: 0,
                                    creditAmount: new Prisma.Decimal(diff),
                                    description: 'Opening Contribution Balance'
                                }
                            ]
                        }
                    }
                })

                // Update 3000 Balance (Equity: Credit +, Debit -)
                await tx.ledgerAccount.update({
                    where: { id: equityAccountId },
                    data: { balance: { decrement: diff } }
                })

                // Update 1200 Balance (Asset: Debit +, Credit -)
                await tx.ledgerAccount.update({
                    where: { id: contribAccountId },
                    data: { balance: { decrement: diff } }
                })

                console.log(`   > Created Tx: ${transaction.id}`)
            })

            migratedCount++
        }
    }

    console.log(`\nMigration Complete. Processed ${migratedCount} members.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect())
