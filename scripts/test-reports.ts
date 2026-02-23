
import { db } from '../lib/db'
import { ReportingService } from '../lib/services/reporting-service'
import { Decimal } from 'decimal.js'

async function testTrialBalance() {
    console.log('\n--- Testing Trial Balance Accuracy ---')
    const asOfDate = new Date()
    const report = await ReportingService.getFinancialStatements('TRIAL_BALANCE', asOfDate)

    if (!report || !report.totals) throw new Error('Trial Balance report failed')

    // 1. Verify Global Equation: Σ Debits = Σ Credits
    const entries = await db.ledgerEntry.findMany({
        where: { ledgerTransaction: { transactionDate: { lte: asOfDate } } }
    })

    let totalDebit = new Decimal(0)
    let totalCredit = new Decimal(0)

    entries.forEach(e => {
        totalDebit = totalDebit.plus(new Decimal(e.debitAmount.toString()))
        totalCredit = totalCredit.plus(new Decimal(e.creditAmount.toString()))
    })

    console.log(`Raw Ledger: Total Debits = ${totalDebit.toFixed(2)}, Total Credits = ${totalCredit.toFixed(2)}`)
    const globalBalance = totalDebit.equals(totalCredit)
    console.log(`Global Balance Equation (D=C): ${globalBalance ? '✅ PASS' : '❌ FAIL'}`)

    // 3. Detect Orphaned Entries (Entries check against missing Accounts)
    const accounts = await db.ledgerAccount.findMany()
    const validAccountIds = accounts.map(a => a.id)
    const orphanedEntries = entries.filter(e => !validAccountIds.includes(e.ledgerAccountId))

    if (orphanedEntries.length > 0) {
        console.log(`❌ Found ${orphanedEntries.length} orphaned ledger entries (ID not in LedgerAccount table)`)
        let orphanedSum = new Decimal(0)
        orphanedEntries.forEach(e => orphanedSum = orphanedSum.plus(new Decimal(e.debitAmount.toString())))
        console.log(`Orphaned Debits Sum: ${orphanedSum.toFixed(2)}`)
    } else {
        console.log('✅ No orphaned entries found.')
    }

    // 2. Verify Report Totals
    const reportDebit = new Decimal(report.totals.debit.toString())
    const reportCredit = new Decimal(report.totals.credit.toString())

    console.log(`Report: Total Debits = ${reportDebit.toFixed(2)}, Total Credits = ${reportCredit.toFixed(2)}`)

    // 4. Precision Check
    const diff = reportDebit.minus(reportCredit).abs()
    console.log(`Report Balance Difference: ${diff.toFixed(20)}`)
    const reportBalance = diff.lt(0.01)
    console.log(`Report Balance Equation: ${reportBalance ? '✅ PASS' : '❌ FAIL'}`)

    return globalBalance && reportBalance && orphanedEntries.length === 0
}

async function testPortfolioReport() {
    console.log('\n--- Testing Active Loan Portfolio Accuracy ---')
    const asOfDate = new Date()
    const report = await ReportingService.getActiveLoanPortfolio(asOfDate)

    if (!report) throw new Error('Portfolio report failed')

    // Ground Truth: Fetch active/overdue loans directly
    const rawLoans = await db.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            disbursementDate: { lte: asOfDate }
        }
    })

    const totalDisbursedGround = rawLoans.reduce((sum, l) => sum.plus(new Decimal(l.amount?.toString() || '0')), new Decimal(0))

    console.log(`Loans Count: Report=${report.summary.totalLoans}, Raw DB=${rawLoans.length}`)
    const countMatch = report.summary.totalLoans === rawLoans.length
    console.log(`Count matching: ${countMatch ? '✅ PASS' : '❌ FAIL'}`)

    const reportDisbursedSum = report.rows.reduce((sum: Decimal, r: any) => sum.plus(new Decimal(r.disbursedAmount.toString())), new Decimal(0))
    const totalDisbursedMatch = reportDisbursedSum.equals(totalDisbursedGround)
    console.log(`Total Disbursed Sum: ${totalDisbursedMatch ? '✅ PASS' : '❌ FAIL'}`)
}

async function testBalanceSheet() {
    console.log('\n--- Testing Balance Sheet Equation ---')
    const asOfDate = new Date()
    const report = await ReportingService.getFinancialStatements('BALANCE_SHEET', asOfDate)

    if (!report || !report.assets || !report.liabilities || !report.equity) throw new Error('Balance Sheet report failed')

    const assets = new Decimal(report.assets.total.toString())
    const liabilities = new Decimal(report.liabilities.total.toString())
    const equity = new Decimal(report.equity.total.toString())

    console.log(`Assets: ${assets.toFixed(2)}`)
    console.log(`Liabilities: ${liabilities.toFixed(2)}`)
    console.log(`Equity: ${equity.toFixed(2)}`)

    const ale = liabilities.plus(equity)
    const balanced = assets.minus(ale).abs().lt(0.01)
    console.log(`A = L + E Check: ${balanced ? '✅ PASS' : '❌ FAIL'}`)
    if (!balanced) {
        console.log(`Difference: ${assets.minus(ale).toFixed(10)}`)
    }
}

async function testIncomeStatement() {
    console.log('\n--- Testing Income Statement Accuracy ---')
    const asOfDate = new Date()
    const report = await ReportingService.getFinancialStatements('INCOME_STATEMENT', asOfDate)

    if (!report || !report.revenue || !report.expenses || report.netIncome === undefined) throw new Error('Income Statement report failed')

    const revenue = new Decimal(report.revenue.total.toString())
    const expenses = new Decimal(report.expenses.total.toString())
    const netIncome = new Decimal(report.netIncome.toString())

    console.log(`Revenue: ${revenue.toFixed(2)}`)
    console.log(`Expenses: ${expenses.toFixed(2)}`)
    console.log(`Net Income: ${netIncome.toFixed(2)}`)

    const verifiedNet = revenue.minus(expenses)
    const match = netIncome.minus(verifiedNet).abs().lt(0.01)
    console.log(`R - E = NI Check: ${match ? '✅ PASS' : '❌ FAIL'}`)
}

async function testOperationalReport() {
    console.log('\n--- Testing Operational Report Accuracy ---')
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)

    const report = await ReportingService.getLendingOperationalReport(startDate, endDate)

    const rawDisbursements = await db.loan.findMany({
        where: {
            disbursementDate: { gte: startDate, lte: endDate }
        }
    })

    console.log(`Disbursements for period: Report=${report.summary.count}, Raw DB=${rawDisbursements.length}`)
    const countMatch = report.summary.count === rawDisbursements.length
    console.log(`operational Disbursement Count match: ${countMatch ? '✅ PASS' : '❌ FAIL'}`)
}

async function main() {
    try {
        await testTrialBalance()
        await testPortfolioReport()
        await testOperationalReport()
        await testBalanceSheet()
        await testIncomeStatement()
    } catch (error) {
        console.error('Test execution failed:', error)
    } finally {
        await db.$disconnect()
    }
}

main()
