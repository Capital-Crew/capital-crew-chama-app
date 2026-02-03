import { PrismaClient } from '@prisma/client'
import { getLoanPrincipalBalance, getLoanInterestBalance, getLoanPenaltyBalance } from '../lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

interface ValidationIssue {
    loanId: string
    loanNumber: string
    issueType: 'MISSING_DISBURSEMENT' | 'BALANCE_MISMATCH' | 'ORPHANED_TRANSACTION' | 'ZERO_LEDGER_ACTIVE'
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    details: string
    suggestedFix: string
}

async function validateLoanLedgerIntegrity() {
    console.log('🔍 Starting Loan Ledger Integrity Validation...\n')

    const issues: ValidationIssue[] = []

    // Fetch all loans (not just active)
    const loans = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'CLEARED', 'DISBURSED'] }
        },
        include: {
            transactions: {
                where: { isReversed: false },
                orderBy: { postedAt: 'asc' }
            }
        },
        orderBy: { disbursementDate: 'desc' }
    })

    console.log(`📋 Found ${loans.length} loans to validate\n`)

    for (const loan of loans) {
        console.log(`Checking ${loan.loanApplicationNumber}...`)

        // CHECK 1: Disbursed/Active loans must have DISBURSEMENT transaction
        if (['ACTIVE', 'OVERDUE', 'CLEARED', 'DISBURSED'].includes(loan.status)) {
            const hasDisbursement = loan.transactions.some(t => t.type === 'DISBURSEMENT')

            if (!hasDisbursement) {
                issues.push({
                    loanId: loan.id,
                    loanNumber: loan.loanApplicationNumber,
                    issueType: 'MISSING_DISBURSEMENT',
                    severity: 'CRITICAL',
                    details: `Loan status is ${loan.status} but no DISBURSEMENT transaction found`,
                    suggestedFix: 'Run backfill-disbursements script'
                })
            }
        }

        // CHECK 2: Ledger balance vs stored balance
        try {
            const ledgerPrincipal = await getLoanPrincipalBalance(loan.id)
            const ledgerInterest = await getLoanInterestBalance(loan.id)
            const ledgerPenalty = await getLoanPenaltyBalance(loan.id)
            const ledgerTotal = ledgerPrincipal + ledgerInterest + ledgerPenalty

            const storedBalance = Number(loan.outstandingBalance)
            const diff = Math.abs(ledgerTotal - storedBalance)

            if (diff > 0.01) {
                issues.push({
                    loanId: loan.id,
                    loanNumber: loan.loanApplicationNumber,
                    issueType: 'BALANCE_MISMATCH',
                    severity: diff > 1000 ? 'HIGH' : 'MEDIUM',
                    details: `Ledger: ${ledgerTotal.toFixed(2)}, Stored: ${storedBalance.toFixed(2)}, Diff: ${diff.toFixed(2)}`,
                    suggestedFix: 'Investigate transaction history, may need manual reconciliation'
                })
            }

            // CHECK 3: Active loan with zero ledger balance
            if (ledgerTotal === 0 && ['ACTIVE', 'OVERDUE'].includes(loan.status)) {
                issues.push({
                    loanId: loan.id,
                    loanNumber: loan.loanApplicationNumber,
                    issueType: 'ZERO_LEDGER_ACTIVE',
                    severity: 'CRITICAL',
                    details: `Loan is ${loan.status} but ledger shows zero balance`,
                    suggestedFix: 'Run backfill-disbursements script'
                })
            }
        } catch (error: any) {
            issues.push({
                loanId: loan.id,
                loanNumber: loan.loanApplicationNumber,
                issueType: 'BALANCE_MISMATCH',
                severity: 'HIGH',
                details: `Error querying ledger: ${error.message}`,
                suggestedFix: 'Check ledger account configuration'
            })
        }

        // CHECK 4: LoanTransactions without ledger reference
        const orphanedTransactions = loan.transactions.filter(t => !t.referenceId)
        if (orphanedTransactions.length > 0) {
            issues.push({
                loanId: loan.id,
                loanNumber: loan.loanApplicationNumber,
                issueType: 'ORPHANED_TRANSACTION',
                severity: 'MEDIUM',
                details: `${orphanedTransactions.length} transactions missing ledger reference`,
                suggestedFix: 'Run link-transactions script'
            })
        }
    }

    // SUMMARY REPORT
    console.log('\n' + '='.repeat(80))
    console.log('📊 VALIDATION SUMMARY')
    console.log('='.repeat(80))

    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL')
    const highIssues = issues.filter(i => i.severity === 'HIGH')
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM')

    console.log(`\n🚨 CRITICAL Issues: ${criticalIssues.length}`)
    console.log(`⚠️  HIGH Issues: ${highIssues.length}`)
    console.log(`📌 MEDIUM Issues: ${mediumIssues.length}`)
    console.log(`\n✅ Clean Loans: ${loans.length - new Set(issues.map(i => i.loanId)).size}`)

    // DETAILED REPORT
    if (issues.length > 0) {
        console.log('\n' + '='.repeat(80))
        console.log('📋 DETAILED ISSUES')
        console.log('='.repeat(80))

        const groupedByType = issues.reduce((acc, issue) => {
            if (!acc[issue.issueType]) acc[issue.issueType] = []
            acc[issue.issueType].push(issue)
            return acc
        }, {} as Record<string, ValidationIssue[]>)

        for (const [type, typeIssues] of Object.entries(groupedByType)) {
            console.log(`\n### ${type} (${typeIssues.length} occurrences)`)
            typeIssues.slice(0, 5).forEach(issue => {
                console.log(`  - ${issue.loanNumber}: ${issue.details}`)
                console.log(`    Fix: ${issue.suggestedFix}`)
            })
            if (typeIssues.length > 5) {
                console.log(`  ... and ${typeIssues.length - 5} more`)
            }
        }
    }

    // EXPORT TO JSON
    const fs = await import('fs')
    const reportPath = './validation-report.json'
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalLoans: loans.length,
        totalIssues: issues.length,
        issuesBySeverity: {
            critical: criticalIssues.length,
            high: highIssues.length,
            medium: mediumIssues.length
        },
        issues
    }, null, 2))

    console.log(`\n📄 Full report saved to: ${reportPath}`)

    await prisma.$disconnect()
    return issues
}

// Run validation
validateLoanLedgerIntegrity()
    .then(issues => {
        if (issues.length === 0) {
            console.log('\n✅ All loans passed validation!')
        } else {
            console.log(`\n⚠️  Found ${issues.length} issues requiring attention`)
        }
        process.exit(issues.filter(i => i.severity === 'CRITICAL').length > 0 ? 1 : 0)
    })
    .catch(error => {
        console.error('❌ Validation failed:', error)
        process.exit(1)
    })
