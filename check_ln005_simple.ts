import { db as prisma } from './lib/db'

async function main() {
  const loan = await (prisma as any).loan.findFirst({
    where: { loanApplicationNumber: 'LN005' }
  })
  
  if (loan) {
    const wr = await (prisma as any).workflowRequest.findFirst({
      where: { entityId: loan.id, entityType: 'LOAN' }
    })
    console.log("LN005 Found in Loan table:")
    console.log(JSON.stringify({ status: loan.status, memberId: loan.memberId, workflowStatus: wr?.status }, null, 2))
    return
  }

  const note = await (prisma as any).loanNote.findFirst({
    where: { loanApplicationNumber: 'LN005' }
  })
  
  if (note) {
    console.log("LN005 Found in LoanNote table:")
    console.log(JSON.stringify({ status: note.status, id: note.id }, null, 2))
    return
  }

  console.log("LN005 not found in either table.")
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
