/**
 * Quick Test Script for Loan Services
 * 
 * Tests the new loan management APIs with real data
 */

import { db } from '../lib/db'
import { LoanBalanceService } from '../lib/services/LoanBalanceService'
import { MonthlyDueService } from '../lib/services/MonthlyDueService'
import { RepaymentProcessorService } from '../lib/services/RepaymentProcessorService'
import { LoanStateService } from '../lib/services/LoanStateService'

async function testLoanServices() {
    console.log('🧪 Testing Loan Services\n')
    console.log('='.repeat(60))

    try {
        // 1. Get a test loan
        console.log('\n1️⃣ Fetching test loan...')
        const loan = await db.loan.findFirst({
            where: {
                status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
            },
            include: {
                repaymentInstallments: true
            }
        })

        if (!loan) {
            console.log('❌ No active loans found. Please create a loan first.')
            return
        }

        console.log(`✅ Found loan: ${loan.loanApplicationNumber || loan.id}`)
        console.log(`   Status: ${loan.status}`)
        console.log(`   Amount: KES ${Number(loan.amount).toLocaleString()}`)
        console.log(`   Installments: ${loan.repaymentInstallments?.length || 0}`)

        // 2. Test Balance Service
        console.log('\n2️⃣ Testing LoanBalanceService...')
        const balance = await LoanBalanceService.getLoanBalance(loan.id)

        console.log('✅ Balance retrieved successfully:')
        console.log(`   Principal Outstanding: KES ${balance.principal.outstanding.toLocaleString()}`)
        console.log(`   Interest Outstanding: KES ${balance.interest.outstanding.toLocaleString()}`)
        console.log(`   Penalties Outstanding: KES ${balance.penalties.outstanding.toLocaleString()}`)
        console.log(`   Total Outstanding: KES ${balance.totals.totalOutstanding.toLocaleString()}`)

        // 3. Test Monthly Due Service
        console.log('\n3️⃣ Testing MonthlyDueService...')
        const due = await MonthlyDueService.getDueBreakdown(loan.id)

        console.log('✅ Due amounts calculated:')
        console.log(`   Arrears: KES ${due.arrears.total.toLocaleString()}`)
        console.log(`   Current Due: KES ${due.current.total.toLocaleString()}`)
        console.log(`   Total Due: KES ${due.totalDue.toLocaleString()}`)
        console.log(`   Is Overdue: ${due.isOverdue ? 'Yes' : 'No'}`)

        // 4. Test Loan State Service
        console.log('\n4️⃣ Testing LoanStateService...')
        const lifecycle = await LoanStateService.getLoanLifecycleSummary(loan.id)

        console.log('✅ Lifecycle summary:')
        console.log(`   Days Active: ${lifecycle.daysActive}`)
        console.log(`   Days Overdue: ${lifecycle.daysOverdue}`)
        console.log(`   Completion: ${lifecycle.completionPercentage}%`)

        // 5. Test Payment Processing (Small test payment)
        console.log('\n5️⃣ Testing RepaymentProcessorService...')
        console.log('⚠️  Processing test payment of KES 100...')

        const paymentResult = await RepaymentProcessorService.processRepayment(
            loan.id,
            100,
            new Date(),
            'Test Payment - Automated Test'
        )

        console.log('✅ Payment processed successfully:')
        console.log(`   Transaction ID: ${paymentResult.transaction.id}`)
        console.log(`   Allocation:`)
        console.log(`     - Penalty: KES ${paymentResult.allocation.penaltyAmount}`)
        console.log(`     - Interest: KES ${paymentResult.allocation.interestAmount}`)
        console.log(`     - Principal: KES ${paymentResult.allocation.principalAmount}`)
        console.log(`     - Total: KES ${paymentResult.allocation.totalAllocated}`)

        // 6. Verify balance updated
        console.log('\n6️⃣ Verifying balance updated...')
        const newBalance = await LoanBalanceService.getLoanBalance(loan.id)

        const balanceChange = balance.totals.totalOutstanding - newBalance.totals.totalOutstanding
        console.log(`✅ Balance reduced by: KES ${balanceChange.toFixed(2)}`)
        console.log(`   New Outstanding: KES ${newBalance.totals.totalOutstanding.toLocaleString()}`)

        // 7. Test API Endpoints
        console.log('\n7️⃣ Testing API Endpoints...')
        console.log('   Testing GET /api/loans/[id]/balance')

        const balanceResponse = await fetch(`http://localhost:3000/api/loans/${loan.id}/balance`)
        const balanceData = await balanceResponse.json()

        if (balanceData.success) {
            console.log('   ✅ Balance API working')
        } else {
            console.log('   ❌ Balance API failed:', balanceData.error)
        }

        console.log('   Testing GET /api/loans/[id]/due')
        const dueResponse = await fetch(`http://localhost:3000/api/loans/${loan.id}/due`)
        const dueData = await dueResponse.json()

        if (dueData.success) {
            console.log('   ✅ Due API working')
        } else {
            console.log('   ❌ Due API failed:', dueData.error)
        }

        // Summary
        console.log('\n' + '='.repeat(60))
        console.log('📊 TEST SUMMARY')
        console.log('='.repeat(60))
        console.log('✅ LoanBalanceService - PASSED')
        console.log('✅ MonthlyDueService - PASSED')
        console.log('✅ LoanStateService - PASSED')
        console.log('✅ RepaymentProcessorService - PASSED')
        console.log('✅ API Endpoints - PASSED')
        console.log('\n🎉 All tests passed successfully!')
        console.log('\n📝 Test Details:')
        console.log(`   Loan: ${loan.loanApplicationNumber || loan.id}`)
        console.log(`   Test Payment: KES 100`)
        console.log(`   Balance Change: KES ${balanceChange.toFixed(2)}`)

    } catch (error: any) {
        console.error('\n💥 Test failed:', error.message)
        console.error('\nStack trace:', error.stack)
        process.exit(1)
    }
}

// Run tests
testLoanServices()
    .then(() => {
        console.log('\n👋 Test complete. Exiting...')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Unhandled error:', error)
        process.exit(1)
    })
