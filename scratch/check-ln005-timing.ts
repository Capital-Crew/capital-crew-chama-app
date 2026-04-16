
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkLN005Timing() {
  const loan = await prisma.loan.findUnique({
    where: { loanApplicationNumber: 'LN005' },
    include: {
        history: true
    }
  })

  if (!loan) {
    console.log("LN005 not found")
    return
  }

  console.log(`Loan ID: ${loan.id}`)
  console.log(`Loan Number: ${loan.loanApplicationNumber}`)
  console.log(`Status: ${loan.status}`)
  console.log(`Created At: ${loan.createdAt}`)
  console.log(`Updated At: ${loan.updatedAt}`)

  // 1. Check ApprovalRequest (Generic)
  const approvalRequests = await prisma.approvalRequest.findMany({
      where: { referenceId: loan.id, referenceTable: 'Loan' }
  })

  if (approvalRequests.length > 0) {
      console.log(`\n--- Approval Requests (Legacy/Generic) ---`)
      approvalRequests.forEach((ar, i) => {
          console.log(`[${i+1}] Status: ${ar.status}`)
          console.log(`    Created: ${ar.createdAt.toISOString()}`)
          console.log(`    Updated: ${ar.updatedAt.toISOString()}`)
          if (ar.status !== 'PENDING') {
              const diffMs = ar.updatedAt.getTime() - ar.createdAt.getTime()
              const diffMin = (diffMs / 60000).toFixed(2)
              console.log(`    Duration: ${diffMin} minutes`)
          }
      })
  }

  // 2. Check WorkflowRequest (Enterprise Engine)
  const workflowRequests = await prisma.workflowRequest.findMany({
      where: { entityId: loan.id, entityType: 'LOAN' },
      include: {
          actions: {
              orderBy: { timestamp: 'asc' }
          }
      }
  })

  if (workflowRequests.length > 0) {
      console.log(`\n--- Workflow Requests (Enterprise) ---`)
      workflowRequests.forEach((wr, i) => {
          console.log(`[${i+1}] Status: ${wr.status}`)
          console.log(`    Created: ${wr.createdAt.toISOString()}`)
          console.log(`    Updated: ${wr.updatedAt.toISOString()}`)
          
          if (wr.actions.length > 0) {
              console.log(`    Actions:`)
              wr.actions.forEach(action => {
                  console.log(`      - ${action.action} by ${action.actorId} at ${action.timestamp.toISOString()}`)
              })
              const completion = wr.actions[wr.actions.length - 1].timestamp
              const diffMs = completion.getTime() - wr.createdAt.getTime()
              console.log(`    Total Duration to Completion: ${(diffMs / 60000).toFixed(2)} minutes`)
          }
      })
  }

  // 3. Check Loan History (Audit Log)
  if (loan.history && loan.history.length > 0) {
      console.log(`\n--- Loan Audit History ---`)
      loan.history.forEach(h => {
          console.log(`- ${h.action} by ${h.actorName} at ${h.timestamp.toISOString()}`)
      })
  }
}

checkLN005Timing().finally(() => prisma.$disconnect())
