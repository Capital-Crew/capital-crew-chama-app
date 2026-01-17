/**
 * Migration Script: Generate Repayment Installments for Existing Loans
 * 
 * Purpose: Create RepaymentInstallment records for loans that don't have them
 * Target: Loans with status ACTIVE, OVERDUE, or DISBURSED
 * 
 * Usage: npx tsx scripts/migrate-loan-installments.ts
 */

import { db } from '../lib/db'
import { ScheduleGeneratorService } from '../lib/services/ScheduleGeneratorService'
import { TransactionReplayService } from '../lib/services/TransactionReplayService'

async function migrateLoanInstallments() {
    console.log('🚀 Starting loan installments migration...\n')

    try {
        // 1. Find loans without installments
        const loansWithoutInstallments = await db.loan.findMany({
            where: {
                status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] },
                repaymentInstallments: {
                    none: {}
                }
            },
            include: {
                loanProduct: true,
                transactions: {
                    where: { type: 'REPAYMENT', isReversed: false },
                    orderBy: { postedAt: 'asc' }
                }
            }
        })

        console.log(`📊 Found ${loansWithoutInstallments.length} loans without installments\n`)

        if (loansWithoutInstallments.length === 0) {
            console.log('✅ No loans need migration. All done!')
            return
        }

        let successCount = 0
        let errorCount = 0
        const errors: Array<{ loanId: string; error: string }> = []

        // 2. Process each loan
        for (const loan of loansWithoutInstallments) {
            try {
                console.log(`Processing Loan: ${loan.loanApplicationNumber || loan.id}`)

                // Validate required data
                if (!loan.amount || !loan.interestRate || !loan.loanProduct) {
                    throw new Error('Missing required loan data (amount, rate, or product)')
                }

                const startDate = loan.disbursementDate || loan.applicationDate || new Date()
                const durationMonths = loan.loanProduct.numberOfRepayments || 12
                const interestType = (loan.loanProduct.interestType as 'FLAT' | 'DECLINING_BALANCE') || 'FLAT'

                // Generate installments
                console.log(`  - Generating ${durationMonths} installments...`)
                const installments = ScheduleGeneratorService.generate(
                    Number(loan.amount),
                    Number(loan.interestRate),
                    durationMonths,
                    interestType,
                    startDate,
                    loan.id
                )

                // Save to database
                await db.repaymentInstallment.createMany({
                    data: installments.map(inst => ({
                        ...inst,
                        loanId: loan.id
                    }))
                })

                console.log(`  - Created ${installments.length} installments`)

                // If loan has existing repayment transactions, replay them
                if (loan.transactions && loan.transactions.length > 0) {
                    console.log(`  - Replaying ${loan.transactions.length} existing transactions...`)

                    const replayResult = await TransactionReplayService.replayTransactions(loan.id)

                    console.log(`  - Updated ${replayResult.installmentsUpdated} installments`)
                }

                successCount++
                console.log(`  ✅ Success\n`)

            } catch (error: any) {
                errorCount++
                const errorMsg = error.message || 'Unknown error'
                errors.push({ loanId: loan.id, error: errorMsg })
                console.error(`  ❌ Error: ${errorMsg}\n`)
            }
        }

        // 3. Summary
        console.log('\n' + '='.repeat(60))
        console.log('📈 Migration Summary')
        console.log('='.repeat(60))
        console.log(`Total Loans Processed: ${loansWithoutInstallments.length}`)
        console.log(`✅ Successful: ${successCount}`)
        console.log(`❌ Failed: ${errorCount}`)

        if (errors.length > 0) {
            console.log('\n❌ Errors:')
            errors.forEach(({ loanId, error }) => {
                console.log(`  - Loan ${loanId}: ${error}`)
            })
        }

        console.log('\n✨ Migration complete!')

    } catch (error: any) {
        console.error('💥 Fatal error during migration:', error)
        process.exit(1)
    }
}

// Run migration
migrateLoanInstallments()
    .then(() => {
        console.log('\n👋 Exiting...')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Unhandled error:', error)
        process.exit(1)
    })
