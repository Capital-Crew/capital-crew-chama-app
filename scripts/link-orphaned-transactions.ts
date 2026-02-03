import { PrismaClient, Prisma } from '@prisma/client'
import { AccountingEngine } from '../lib/accounting/AccountingEngine'
import { getSystemMappingsDict } from '../app/actions/system-accounting'

const prisma = new PrismaClient()

async function linkOrphanedTransactions(dryRun: boolean = true) {
    console.log(`🔗 Link Orphaned Transactions (${dryRun ? 'DRY RUN' : 'LIVE MODE'})\n`)

    // Find LoanTransactions without referenceId
    const orphans = await prisma.loanTransaction.findMany({
        where: {
            referenceId: null,
            isReversed: false
        },
        include: { loan: true }
    })

    console.log(`Found ${orphans.length} orphaned transactions\n`)

    if (orphans.length === 0) {
        console.log('✅ No orphans found!')
        return
    }

    const mappings = await getSystemMappingsDict()
    let linkedCount = 0
    let createdCount = 0

    for (const tx of orphans) {
        console.log(`Processing TX on ${tx.loan.loanApplicationNumber} (${tx.type} - ${tx.amount})...`)

        // 1. Try to find matching LedgerTransaction
        const refType = tx.type === 'DISBURSEMENT' ? 'LOAN_DISBURSEMENT' :
            tx.type === 'REPAYMENT' ? 'LOAN_REPAYMENT' :
                tx.type === 'INTEREST' ? 'LOAN_INTEREST_ACCRUAL' : null

        if (!refType) {
            console.log(`  ⚠️ Unknown type ${tx.type}, skipping`)
            continue
        }

        // Find candidate ledger transaction
        // Match: ReferenceType, ReferenceID (LoanID), Amount (approx)
        // Date match is loose because of slight timing diffs
        const matches = await prisma.ledgerTransaction.findMany({
            where: {
                referenceType: refType as any,
                referenceId: tx.loanId,
                totalAmount: tx.amount, // Exact match on decimal ?
                isReversed: false
            }
        })

        let match = matches[0]

        if (match) {
            console.log(`  ✅ Found matching LedgerTransaction ${match.id}`)
            if (!dryRun) {
                await prisma.loanTransaction.update({
                    where: { id: tx.id },
                    data: { referenceId: match.id }
                })
            } else {
                console.log(`  📝 [DRY RUN] Would link to ${match.id}`)
            }
            linkedCount++
        } else {
            console.log(`  ⚠️ No matching LedgerTransaction found. Needs Backfill.`)

            // 2. Backfill LedgerTransaction if missing
            if (tx.type === 'DISBURSEMENT') {
                if (!dryRun) {
                    await prisma.$transaction(async (dbTx) => {
                        const journalEntry = await AccountingEngine.postJournalEntry({
                            transactionDate: tx.postedAt,
                            referenceType: 'LOAN_DISBURSEMENT',
                            referenceId: tx.loanId,
                            description: `[BACKFILL] Disbursement link repair`,
                            notes: `Repair for orphaned LoanTransaction ${tx.id}`,
                            lines: [
                                {
                                    accountCode: mappings.EVENT_LOAN_DISBURSEMENT!,
                                    debitAmount: Number(tx.amount),
                                    creditAmount: 0,
                                    description: `Principal - ${tx.loan.loanApplicationNumber}`
                                },
                                {
                                    accountCode: mappings.MEMBER_WALLET!,
                                    debitAmount: 0,
                                    creditAmount: Number(tx.amount),
                                    description: 'Member wallet credit'
                                }
                            ],
                            createdBy: 'SYSTEM',
                            createdByName: 'Link Repair Script'
                        }, dbTx)

                        await dbTx.loanTransaction.update({
                            where: { id: tx.id },
                            data: { referenceId: journalEntry.id }
                        })
                    })
                    console.log(`  ✅ Backfilled Ledger Entry`)
                } else {
                    console.log(`  📝 [DRY RUN] Would backfill ledger entry`)
                }
                createdCount++
            } else if (tx.type === 'INTEREST') {
                if (!dryRun) {
                    await prisma.$transaction(async (dbTx) => {
                        const journalEntry = await AccountingEngine.postJournalEntry({
                            transactionDate: tx.postedAt,
                            referenceType: 'LOAN_INTEREST_ACCRUAL', // Correct Enum Value
                            referenceId: tx.loanId,
                            description: `[BACKFILL] Interest accrual link repair`,
                            notes: `Repair for orphaned LoanTransaction ${tx.id}`,
                            lines: [
                                {
                                    accountCode: mappings.RECEIVABLE_LOAN_INTEREST!,
                                    debitAmount: Number(tx.amount),
                                    creditAmount: 0,
                                    description: `Interest Receivable - ${tx.loan.loanApplicationNumber}`
                                },
                                {
                                    accountCode: mappings.INCOME_LOAN_INTEREST!,
                                    debitAmount: 0,
                                    creditAmount: Number(tx.amount),
                                    description: 'Interest Income'
                                }
                            ],
                            createdBy: 'SYSTEM',
                            createdByName: 'Link Repair Script'
                        }, dbTx)

                        await dbTx.loanTransaction.update({
                            where: { id: tx.id },
                            data: { referenceId: journalEntry.id }
                        })
                    })
                    console.log(`  ✅ Backfilled Ledger Entry (Interest)`)
                } else {
                    console.log(`  📝 [DRY RUN] Would backfill ledger entry (Interest)`)
                }
                createdCount++
            } else if (tx.type === 'REPAYMENT') {
                // Determine allocation from LoanTransaction fields
                const principal = Number(tx.principalAmount || 0)
                const interest = Number(tx.interestAmount || 0)
                const penalty = Number(tx.penaltyAmount || 0)
                const fee = Number(tx.feeAmount || 0)

                if (!dryRun) {
                    await prisma.$transaction(async (dbTx) => {
                        const lines: any[] = []

                        if (penalty > 0) lines.push({
                            accountCode: mappings.RECEIVABLE_LOAN_PENALTY!,
                            debitAmount: 0,
                            creditAmount: penalty,
                            description: 'Penalty paid (Repair)'
                        })
                        if (interest > 0) lines.push({
                            accountCode: mappings.RECEIVABLE_LOAN_INTEREST!,
                            debitAmount: 0,
                            creditAmount: interest,
                            description: 'Interest paid (Repair)'
                        })
                        if (principal > 0) lines.push({
                            accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL!,
                            debitAmount: 0,
                            creditAmount: principal,
                            description: 'Principal paid (Repair)'
                        })
                        // Cash (Debit)
                        lines.push({
                            accountCode: mappings.EVENT_CASH_DEPOSIT!, // Default to Cash
                            debitAmount: Number(tx.amount),
                            creditAmount: 0,
                            description: 'Repayment Received (Repair)'
                        })

                        const journalEntry = await AccountingEngine.postJournalEntry({
                            transactionDate: tx.postedAt,
                            referenceType: 'LOAN_REPAYMENT',
                            referenceId: tx.loanId,
                            description: `[BACKFILL] Repayment link repair`,
                            notes: `Repair for orphaned LoanTransaction ${tx.id}`,
                            lines: lines,
                            createdBy: 'SYSTEM',
                            createdByName: 'Link Repair Script'
                        }, dbTx)

                        await dbTx.loanTransaction.update({
                            where: { id: tx.id },
                            data: { referenceId: journalEntry.id }
                        })
                    })
                    console.log(`  ✅ Backfilled Ledger Entry`)
                } else {
                    console.log(`  📝 [DRY RUN] Would backfill ledger entry`)
                }
                createdCount++
            } else {
                console.log(`  ❌ Cannot auto-backfill type ${tx.type}`)
            }
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`Linked: ${linkedCount}`)
    console.log(`Created: ${createdCount}`)
    console.log(`Unresolved: ${orphans.length - linkedCount - createdCount}`)
}

// Ensure Decimal prototype serialized for console
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

const args = process.argv.slice(2)
const isLive = args.includes('--live')

linkOrphanedTransactions(!isLive)
    .then(() => {
        console.log('\n✅ Cleanup complete')
        process.exit(0)
    })
    .catch(error => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
