import { getMemberFullDetail } from '../app/actions/member-dashboard-actions'

async function test() {
  const memberId = 'cml4we3ck0000jx04wvz9cts5' // SAMUEL MWANIKI
  const detail = await getMemberFullDetail(memberId)
  
  if (detail) {
    console.log('Member Name:', detail.member.name)
    console.log('Stats Outstanding Loans:', detail.stats.outstandingLoans)
    console.log('Loans Count:', detail.loans.length)
    if (detail.loans.length > 0) {
        console.log('First Loan Balance:', detail.loans[0].outstandingBalance)
        console.log('Transactions Count:', detail.loans[0].transactions?.length)
        if (detail.loans[0].transactions?.length > 0) {
            console.log('First Transaction Amount:', detail.loans[0].transactions[0].amount)
            console.log('First Transaction Type:', detail.loans[0].transactions[0].type)
        }
    }
  } else {
    console.log('Member not found')
  }
}

test().catch(console.error)
