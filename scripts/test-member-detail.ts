import { getMemberFullDetail } from '../app/actions/member-dashboard-actions'

async function test() {
  const memberId = 'cmkt8hk4l0007tmjova32q9rh' // System Admin from previous script
  const detail = await getMemberFullDetail(memberId)
  
  if (detail) {
    console.log('Member Name:', detail.member.name)
    console.log('Stats Outstanding Loans:', detail.stats.outstandingLoans)
    console.log('Stats Total Outstanding Balance:', detail.stats.totalOutstandingBalance)
    console.log('Loans Count:', detail.loans.length)
    if (detail.loans.length > 0) {
        console.log('First Loan Portfolio Balance:', detail.loans[0].outstandingBalance)
        console.log('First Loan Transactions Count:', detail.loans[0].transactions?.length)
    }
  } else {
    console.log('Member not found')
  }
}

test().catch(console.error)
// Since this script uses server actions, it might be tricky to run with tsx if it has complex imports
