
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkLN005DetailedTiming() {
  const loan = await prisma.loan.findUnique({
    where: { loanApplicationNumber: 'LN005' }
  })

  if (!loan) {
    console.log("LN005 not found")
    return
  }

  // Find the exact ApprovalRequest and WorkflowRequest
  const ar = await prisma.approvalRequest.findFirst({
      where: { referenceId: loan.id, referenceTable: 'Loan' },
      orderBy: { createdAt: 'desc' }
  })

  const wr = await prisma.workflowRequest.findFirst({
      where: { entityId: loan.id, entityType: 'LOAN' },
      orderBy: { createdAt: 'desc' }
  })

  console.log(`Loan ID: ${loan.id}`)
  console.log(`Loan UpdatedAt: ${loan.updatedAt.toISOString()}`)
  
  if (ar) {
      console.log(`ApprovalRequest CreatedAt: ${ar.createdAt.toISOString()}`)
  }
  
  if (wr) {
      console.log(`WorkflowRequest CreatedAt: ${wr.createdAt.toISOString()}`)
  }

  // The "click" happens before the server action starts.
  // The transition to PENDING_APPROVAL happens when prisma.loan.update/create is called.
  
  if (ar) {
      const diff = ar.createdAt.getTime() - loan.updatedAt.getTime()
      console.log(`Gap between Loan Update and ApprovalRequest: ${diff} ms`)
  }

  if (wr && ar) {
      const diff = wr.createdAt.getTime() - ar.createdAt.getTime()
      console.log(`Gap between ApprovalRequest and WorkflowRequest: ${diff} ms`)
  }
}

checkLN005DetailedTiming().finally(() => prisma.$disconnect())
