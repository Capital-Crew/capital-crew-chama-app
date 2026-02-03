import { PrismaClient } from '@prisma/client'
import { getLoanOutstandingBalance } from '../lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

interface ReconciliationResult {
    loanNumber: string
    storedBalance: number
    ledgerBalance: number
    difference: number
    percentDiff: number
    status: 'MATCH' | 'MINOR_DIFF' | 'MAJOR_DIFF'
}

async function reconcileLedgerVsStored() {
    console.log('🔍 Reconciling Ledger vs Stored Balances\n')

    const loans = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE'] }
        },
        select: {
            id: true,
            loanApplicationNumber: true,
            outstandingBalance: true
        }
    })

    console.log(`📋 Reconciling ${loans.length} active loans\n`)

    const results: ReconciliationResult[] = []
    let totalStoredBalance = 0
    let totalLedgerBalance = 0

    for (const loan of loans) {
        const storedBalance = Number(loan.outstandingBalance)
        const ledgerBalance = await getLoanOutstandingBalance(loan.id)
        const difference = ledgerBalance - storedBalance
        const percentDiff = storedBalance > 0 ? (difference / storedBalance) * 100 : 0

        totalStoredBalance += storedBalance
        totalLedgerBalance += ledgerBalance

        let status: 'MATCH' | 'MINOR_DIFF' | 'MAJOR_DIFF'
        if (Math.abs(difference) < 0.01) {
            status = 'MATCH'
        } else if (Math.abs(percentDiff) < 1) {
            status = 'MINOR_DIFF'
        } else {
            status = 'MAJOR_DIFF'
        }

        results.push({
            loanNumber: loan.loanApplicationNumber,
            storedBalance,
            ledgerBalance,
            difference,
            percentDiff,
            status
        })
    }

    // SUMMARY
    console.log('='.repeat(80))
    console.log('📊 RECONCILIATION SUMMARY')
    console.log('='.repeat(80))

    const matches = results.filter(r => r.status === 'MATCH').length
    const minorDiffs = results.filter(r => r.status === 'MINOR_DIFF').length
    const majorDiffs = results.filter(r => r.status === 'MAJOR_DIFF').length

    console.log(`\n✅ Perfect Matches: ${matches} (${((matches / results.length) * 100).toFixed(1)}%)`)
    console.log(`📌 Minor Differences (<1%): ${minorDiffs}`)
    console.log(`🚨 Major Differences (>1%): ${majorDiffs}`)

    console.log(`\n💰 Total Stored Balance: ${totalStoredBalance.toLocaleString()}`)
    console.log(`💰 Total Ledger Balance: ${totalLedgerBalance.toLocaleString()}`)
    console.log(`💰 Total Difference: ${(totalLedgerBalance - totalStoredBalance).toLocaleString()}`)

    // Show major differences
    if (majorDiffs > 0) {
        console.log('\n' + '='.repeat(80))
        console.log('🚨 MAJOR DIFFERENCES (>1%)')
        console.log('='.repeat(80))

        results
            .filter(r => r.status === 'MAJOR_DIFF')
            .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
            .slice(0, 10)
            .forEach(r => {
                console.log(`\n${r.loanNumber}:`)
                console.log(`  Stored: ${r.storedBalance.toLocaleString()}`)
                console.log(`  Ledger: ${r.ledgerBalance.toLocaleString()}`)
                console.log(`  Diff: ${r.difference.toLocaleString()} (${r.percentDiff.toFixed(2)}%)`)
            })
    }

    // Export report
    const fs = await import('fs')
    fs.writeFileSync('./reconciliation-report.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalLoans: results.length,
            matches,
            minorDiffs,
            majorDiffs,
            totalStoredBalance,
            totalLedgerBalance,
            totalDifference: totalLedgerBalance - totalStoredBalance
        },
        details: results
    }, null, 2))

    console.log('\n📄 Full report saved to: reconciliation-report.json')

    await prisma.$disconnect()
    return results
}

reconcileLedgerVsStored()
    .then(() => {
        console.log('\n✅ Reconciliation complete')
        process.exit(0)
    })
    .catch(error => {
        console.error('❌ Reconciliation failed:', error)
        process.exit(1)
    })
