/**
 * API Test Script
 * 
 * Tests all loan service API endpoints
 * Usage: npx tsx scripts/test-api-endpoints.ts
 */

async function testAPIEndpoints() {
    const BASE_URL = 'http://localhost:3000' // Adjust port if needed

    console.log('🧪 Testing Loan Service API Endpoints\n')
    console.log(`Base URL: ${BASE_URL}\n`)

    // You'll need to replace these with actual IDs from your database
    const TEST_LOAN_ID = 'YOUR_LOAN_ID_HERE'
    const TEST_MEMBER_ID = 'YOUR_MEMBER_ID_HERE'

    try {
        // Test 1: Get Loan Balance
        console.log('1️⃣ Testing GET /api/loans/[loanId]/balance')
        const balanceResponse = await fetch(`${BASE_URL}/api/loans/${TEST_LOAN_ID}/balance`)
        const balanceData = await balanceResponse.json()

        if (balanceData.success) {
            console.log('✅ Success!')
            console.log('   Principal Outstanding:', balanceData.data.principal.outstanding)
            console.log('   Interest Outstanding:', balanceData.data.interest.outstanding)
            console.log('   Total Outstanding:', balanceData.data.totals.totalOutstanding)
        } else {
            console.log('❌ Failed:', balanceData.error)
        }
        console.log()

        // Test 2: Get Due Amounts
        console.log('2️⃣ Testing GET /api/loans/[loanId]/due')
        const dueResponse = await fetch(`${BASE_URL}/api/loans/${TEST_LOAN_ID}/due`)
        const dueData = await dueResponse.json()

        if (dueData.success) {
            console.log('✅ Success!')
            console.log('   Arrears:', dueData.data.arrears.total)
            console.log('   Current Due:', dueData.data.current.total)
            console.log('   Total Due:', dueData.data.totalDue)
            console.log('   Is Overdue:', dueData.data.isOverdue)
        } else {
            console.log('❌ Failed:', dueData.error)
        }
        console.log()

        // Test 3: Get Member Portfolio
        console.log('3️⃣ Testing GET /api/members/[memberId]/portfolio')
        const portfolioResponse = await fetch(`${BASE_URL}/api/members/${TEST_MEMBER_ID}/portfolio`)
        const portfolioData = await portfolioResponse.json()

        if (portfolioData.success) {
            console.log('✅ Success!')
            console.log('   Active Loans:', portfolioData.data.activeLoans)
            console.log('   Total Disbursed:', portfolioData.data.totalDisbursed)
            console.log('   Total Outstanding:', portfolioData.data.totalOutstanding)
            console.log('   Total Arrears:', portfolioData.data.totalArrears)
        } else {
            console.log('❌ Failed:', portfolioData.error)
        }
        console.log()

        // Test 4: Process Repayment (commented out to avoid accidental payments)
        console.log('4️⃣ Testing POST /api/loans/[loanId]/repayment')
        console.log('⚠️  Skipped (uncomment to test actual payment processing)')
        console.log('   Example payload:')
        console.log('   {')
        console.log('     "amount": 1000,')
        console.log('     "description": "Test Payment"')
        console.log('   }')
        console.log()

        /*
        const repaymentResponse = await fetch(`${BASE_URL}/api/loans/${TEST_LOAN_ID}/repayment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 1000,
            description: 'Test Payment'
          })
        })
        const repaymentData = await repaymentResponse.json()
        console.log(repaymentData)
        */

        console.log('✨ API Testing Complete!\n')
        console.log('📝 Next Steps:')
        console.log('   1. Replace TEST_LOAN_ID and TEST_MEMBER_ID with actual values')
        console.log('   2. Uncomment repayment test to test payment processing')
        console.log('   3. Check server logs for any errors')

    } catch (error: any) {
        console.error('💥 Error during testing:', error.message)
        console.log('\n⚠️  Make sure:')
        console.log('   - Dev server is running (npm run dev)')
        console.log('   - Database is accessible')
        console.log('   - Test IDs are valid')
    }
}

// Run tests
testAPIEndpoints()
