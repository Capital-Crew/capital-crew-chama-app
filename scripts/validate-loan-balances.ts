/**
 * Validation Script: Verify Loan Balance Consistency
 * 
 * Purpose: Compare old calculation method vs new service-based calculation
 * Ensures migration didn't introduce discrepancies
 * 
 * Usage: npx tsx scripts/validate-loan-balances.ts
 */

import { db } from '../lib/db'
import { LoanBalanceService } from '../lib/services/LoanBalanceService'

import { processTransactions } from '../lib/statementProcessor'

async function validateLoanBalances() {
    console.log('🔍 Starting loan balance validation...\n')

    try {
        // Get all active/overdue loans with installments
        const loans = await db.loan.findMany({
            where: {
                status: { in: ['ACTIVE', 'OVERDUE'] },
                repaymentInstallments: {
                    some: {}
                }
            },
            include: {
                transactions: {
                    where: { isReversed: false },
                    orderBy: { postedAt: 'asc' }
                },
                repaymentInstallments: true
            },
            take: 50 // Limit for testing
        })

        console.log(`📊 Validating ${loans.length} loans\n`)

        const results: Array<{
            loanId: string
            loanNumber: string
            status: 'PASS' | 'FAIL' | 'WARNING'
            oldBalance: number
            newBalance: number
            difference: number
            details?: string
        }> = []

        for (const loan of loans) {
            try {
                // OLD METHOD: Statement processor
                const mappedTransactions = loan.transactions.map((tx: any) => ({
                    ...tx,
                    amount: Number(tx.amount),
                    createdAt: tx.postedAt,
                    type: tx.type
                }))

                const statementRows = processTransactions(mappedTransactions as any[])
                const oldBalance = statementRows.length > 0
                    ? statementRows[statementRows.length - 1].runningBalance
                    : 0

                // NEW METHOD: LoanBalanceService
                const newBalanceData = await LoanBalanceService.getLoanBalance(loan.id)
                const newBalance = newBalanceData.totals.totalOutstanding

                // Compare
                const difference = Math.abs(oldBalance - newBalance)
                const tolerance = 1.0 // Allow KES 1 difference due to rounding

                let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS'
                let details = ''

                if (difference > tolerance) {
                    if (difference > 100) {
                        status = 'FAIL'
                        details = `Significant discrepancy: KES ${difference.toFixed(2)}`
                    } else {
                        status = 'WARNING'
                        details = `Minor discrepancy: KES ${difference.toFixed(2)} (likely rounding)`
                    }
                }

                results.push({
                    loanId: loan.id,
                    loanNumber: loan.loanApplicationNumber || loan.id.substring(0, 8),
                    status,
                    oldBalance,
                    newBalance,
                    difference,
                    details
                })

                // Log progress
                const icon = status === 'PASS' ? '✅' : status === 'WARNING' ? '⚠️' : '❌'
                console.log(`${icon} ${loan.loanApplicationNumber || loan.id.substring(0, 8)}: Old=${oldBalance.toFixed(2)}, New=${newBalance.toFixed(2)}`)

            } catch (error: any) {
                results.push({
                    loanId: loan.id,
                    loanNumber: loan.loanApplicationNumber || loan.id.substring(0, 8),
                    status: 'FAIL',
                    oldBalance: 0,
                    newBalance: 0,
                    difference: 0,
                    details: `Error: ${error.message}`
                })
                console.error(`❌ ${loan.loanApplicationNumber || loan.id.substring(0, 8)}: ${error.message}`)
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60))
        console.log('📊 Validation Summary')
        console.log('='.repeat(60))

        const passCount = results.filter(r => r.status === 'PASS').length
        const warnCount = results.filter(r => r.status === 'WARNING').length
        const failCount = results.filter(r => r.status === 'FAIL').length

        console.log(`Total Loans: ${results.length}`)
        console.log(`✅ Passed: ${passCount} (${((passCount / results.length) * 100).toFixed(1)}%)`)
        console.log(`⚠️  Warnings: ${warnCount} (${((warnCount / results.length) * 100).toFixed(1)}%)`)
        console.log(`❌ Failed: ${failCount} (${((failCount / results.length) * 100).toFixed(1)}%)`)

        // Show failures
        const failures = results.filter(r => r.status === 'FAIL')
        if (failures.length > 0) {
            console.log('\n❌ Failed Loans:')
            failures.forEach(f => {
                console.log(`  - ${f.loanNumber}: ${f.details}`)
            })
        }

        // Show warnings
        const warnings = results.filter(r => r.status === 'WARNING')
        if (warnings.length > 0) {
            console.log('\n⚠️  Warnings:')
            warnings.forEach(w => {
                console.log(`  - ${w.loanNumber}: ${w.details}`)
            })
        }

        console.log('\n✨ Validation complete!')

        // Exit with error if failures
        if (failCount > 0) {
            console.log('\n⚠️  Some loans failed validation. Please review.')
            process.exit(1)
        }

    } catch (error: any) {
        console.error('💥 Fatal error during validation:', error)
        process.exit(1)
    }
}

// Run validation
validateLoanBalances()
    .then(() => {
        console.log('\n👋 Exiting...')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Unhandled error:', error)
        process.exit(1)
    })
