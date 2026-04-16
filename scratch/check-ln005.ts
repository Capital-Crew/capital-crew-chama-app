
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Checking Loan table for LN005...")
  const loan = await prisma.loan.findUnique({
    where: { loanApplicationNumber: 'LN005' },
    include: {
      member: true,
      approvals: true
    }
  })
  
  if (loan) {
    console.log("Found in Loan table:")
    console.log(JSON.stringify(loan, null, 2))

    console.log("\nChecking WorkflowRequests for Loan LN005...")
    const wfRequests = await prisma.workflowRequest.findMany({
      where: {
        entityId: loan.id,
        entityType: 'LOAN'
      },
      include: {
        currentStage: true,
        actions: {
          include: {
            actor: true
          }
        }
      }
    })
    console.log(JSON.stringify(wfRequests, null, 2))

    console.log("\nChecking ApprovalRequests for Loan LN005...")
    const appRequests = await prisma.approvalRequest.findMany({
      where: {
        referenceId: loan.id,
        type: 'LOAN'
      }
    })
    console.log(JSON.stringify(appRequests, null, 2))
  } else {
    console.log("Not found in Loan table.")
  }

  console.log("\nChecking LoanNote table for LN005...")
  const loanNote = await prisma.loanNote.findUnique({
    where: { referenceNo: 'LN005' },
    include: {
      floater: true,
      subscriptions: true
    }
  })

  if (loanNote) {
    console.log("Found in LoanNote table:")
    console.log(JSON.stringify(loanNote, null, 2))

    console.log("\nChecking WorkflowRequests for LoanNote LN005...")
    const wfRequests = await prisma.workflowRequest.findMany({
      where: {
        entityId: loanNote.id,
        entityType: 'LOAN_NOTE'
      },
      include: {
        currentStage: true,
        actions: {
          include: {
            actor: true
          }
        }
      }
    })
    console.log(JSON.stringify(wfRequests, null, 2))
  } else {
    console.log("Not found in LoanNote table.")
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
