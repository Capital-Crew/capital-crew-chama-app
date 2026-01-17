/**
 * Simple Loan Services Test (No API calls)
 */

import { db } from '../lib/db'
import { LoanBalanceService } from '../lib/services/LoanBalanceService'
import { MonthlyDueService } from '../lib/services/MonthlyDueService'
import { LoanStateService } from '../lib/services/LoanStateService'

async function simpleTest() {
    console.log('🧪 Simple Loan Services Test\n')

    try {
        // Get all active loans
        const loans = await db.loan.findMany({
            where: {
                status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
            },
            include: {
                repaymentInstallments: { take: 1 }
            },
            take: 3
        })

        console.log(`Found ${loans.length} active loans\n`)

        for (const loan of loans) {
            console.log(`📋 Loan: ${loan.loanApplicationNumber || loan.id}`)
            console.log(`   Status: ${loan.status}`)
            console.log(`   Amount: KES ${Number(loan.amount).toLocaleString()}`)

            // Test balance
            const balance = await LoanBalanceService.getLoanBalance(loan.id)
            console.log(`   Outstanding: KES ${balance.totals.totalOutstanding.toLocaleString()}`)

            // Test due
            const due = await MonthlyDueService.getDueBreakdown(loan.id)
            console.log(`   Total Due: KES ${due.totalDue.toLocaleString()}`)
            console.log(`   Overdue: ${due.isOverdue ? 'Yes' : 'No'}`)

            // Test lifecycle
            const lifecycle = await LoanStateService.getLoanLifecycleSummary(loan.id)
            console.log(`   Completion: ${lifecycle.completionPercentage}%`)
            console.log()
        }

        console.log('✅ All services working correctly!')

    } catch (error: any) {
        console.error('❌ Error:', error.message)
    }
}

simpleTest().then(() => process.exit(0))
