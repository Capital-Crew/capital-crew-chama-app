import { PrismaClient, Prisma } from '@prisma/client'
import { AccountingEngine } from '../lib/accounting/AccountingEngine'
import { getSystemMappingsDict } from '../app/actions/system-accounting'

const prisma = new PrismaClient()

interface BackfillResult {
    loanId: string
    loanNumber: string
    action: 'CREATED_LOAN_TX' | 'CREATED_LEDGER_ENTRY' | 'ALREADY_COMPLETE' | 'SKIPPED'
    details: string
}

async function backfillDisbursements(dryRun: boolean = true) {
    console.log(`🔧 Backfill Disbursements (${dryRun ? 'DRY RUN' : 'LIVE MODE'})\n`)

    const results: BackfillResult[] = []

    // Find loans missing disbursement transactions
    const loansNeedingBackfill = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'CLEARED', 'DISBURSED'] },
            disbursementDate: { not: null }
        },
        include: {
            transactions: {
                where: { type: 'DISBURSEMENT', isReversed: false }
            }
        }
    })

    console.log(`📋 Found ${loansNeedingBackfill.length} disbursed loans\n`)

    const loansToFix = loansNeedingBackfill.filter(loan => loan.transactions.length === 0)
    console.log(`🔨 ${loansToFix.length} loans need backfill\n`)

    if (loansToFix.length === 0) {
        console.log('✅ No backfill needed!')
        await prisma.$disconnect()
        return results
    }

    // Get system mappings
    const mappings = await getSystemMappingsDict()

    for (const loan of loansToFix) {
        console.log(`Processing ${loan.loanApplicationNumber}...`)

        try {
            if (!dryRun) {
                await prisma.$transaction(async (tx) => {
                    // 1. Create LoanTransaction (DISBURSEMENT)
                    const loanTx = await tx.loanTransaction.create({
                        data: {
                            loanId: loan.id,
                            type: 'DISBURSEMENT',
                            amount: loan.amount,
                            principalAmount: loan.amount,
                            interestAmount: 0,
                            penaltyAmount: 0,
                            feeAmount: 0,
                            description: '[BACKFILL] Loan Disbursement',
                            postedAt: loan.disbursementDate || loan.createdAt
                        }
                    })

                    // 2. Post to General Ledger
                    const journalEntry = await AccountingEngine.postJournalEntry({
                        transactionDate: loan.disbursementDate || loan.createdAt,
                        referenceType: 'LOAN_DISBURSEMENT',
                        referenceId: loan.id,
                        description: `[BACKFILL] Loan ${loan.loanApplicationNumber}`,
                        notes: 'Historical disbursement backfilled during ledger hardening',
                        lines: [
                            {
                                accountCode: mappings.EVENT_LOAN_DISBURSEMENT!,
                                debitAmount: Number(loan.amount),
                                creditAmount: 0,
                                description: `Principal - ${loan.loanApplicationNumber}`
                            },
                            {
                                accountCode: mappings.MEMBER_WALLET!,
                                debitAmount: 0,
                                creditAmount: Number(loan.amount),
                                description: 'Member wallet credit'
                            }
                        ],
                        createdBy: 'SYSTEM',
                        createdByName: 'Backfill Script'
                    }, tx)

                    // 3. Link LoanTransaction to LedgerTransaction
                    await tx.loanTransaction.update({
                        where: { id: loanTx.id },
                        data: { referenceId: journalEntry.id }
                    })

                    results.push({
                        loanId: loan.id,
                        loanNumber: loan.loanApplicationNumber,
                        action: 'CREATED_LEDGER_ENTRY',
                        details: `Created disbursement for ${loan.amount} on ${loan.disbursementDate?.toISOString()}`
                    })
                })

                console.log(`  ✅ Backfilled successfully`)
            } else {
                results.push({
                    loanId: loan.id,
                    loanNumber: loan.loanApplicationNumber,
                    action: 'CREATED_LEDGER_ENTRY',
                    details: `[DRY RUN] Would create disbursement for ${loan.amount}`
                })
                console.log(`  📝 [DRY RUN] Would backfill`)
            }
        } catch (error: any) {
            console.error(`  ❌ Error: ${error.message}`)
            results.push({
                loanId: loan.id,
                loanNumber: loan.loanApplicationNumber,
                action: 'SKIPPED',
                details: `Error: ${error.message}`
            })
        }
    }

    // SUMMARY
    console.log('\n' + '='.repeat(80))
    console.log('📊 BACKFILL SUMMARY')
    console.log('='.repeat(80))
    console.log(`\nTotal Processed: ${loansToFix.length}`)
    console.log(`✅ Successful: ${results.filter(r => r.action === 'CREATED_LEDGER_ENTRY').length}`)
    console.log(`❌ Failed: ${results.filter(r => r.action === 'SKIPPED').length}`)

    if (dryRun) {
        console.log('\n⚠️  This was a DRY RUN. No changes were made.')
        console.log('To apply changes, run: npx tsx scripts/backfill-loan-disbursements.ts --live')
    }

    await prisma.$disconnect()
    return results
}

// Parse command line args
const args = process.argv.slice(2)
const isLive = args.includes('--live')

backfillDisbursements(!isLive)
    .then(results => {
        console.log('\n✅ Backfill complete')
        process.exit(0)
    })
    .catch(error => {
        console.error('❌ Backfill failed:', error)
        process.exit(1)
    })
