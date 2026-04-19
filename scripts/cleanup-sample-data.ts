import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING SAMPLE DATA CLEANUP ---')

  // 1. Logs & Events (No primary dependents)
  console.log('Clearing logs and events...')
  await prisma.auditLog.deleteMany({})
  await prisma.commandLog.deleteMany({})
  await prisma.domainEvent.deleteMany({})
  await prisma.loanJourneyEvent.deleteMany({})
  await prisma.welfareJourneyEvent.deleteMany({})
  await prisma.approvalHistory.deleteMany({})
  await prisma.idempotencyRecord.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.reversalLog.deleteMany({})
  await prisma.loanHistory.deleteMany({})

  // 2. Transaction Details & Child Records
  console.log('Clearing transaction details and child records...')
  await prisma.ledgerEntry.deleteMany({})
  await prisma.loanTransaction.deleteMany({})
  await prisma.repaymentInstallment.deleteMany({})
  await prisma.interestPosting.deleteMany({})
  await prisma.loanTopUp.deleteMany({})
  await prisma.loanDraft.deleteMany({})
  await prisma.loanApproval.deleteMany({})
  await prisma.guarantorMap.deleteMany({})
  await prisma.transferApproval.deleteMany({})
  await prisma.welfareApproval.deleteMany({})
  await prisma.meetingAttendee.deleteMany({})
  await prisma.apology.deleteMany({})
  await prisma.attendanceFine.deleteMany({})
  await prisma.batchItem.deleteMany({})
  await prisma.contributionTransaction.deleteMany({})
  await prisma.walletTransaction.deleteMany({})
  await prisma.workflowAction.deleteMany({})
  await prisma.approvalDelegation.deleteMany({})

  // 3. Transactions & Main Transaction Entities
  console.log('Clearing main transaction entities...')
  await prisma.loan.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.transferRequest.deleteMany({})
  await prisma.welfareRequisition.deleteMany({})
  await prisma.batchPayment.deleteMany({})
  await prisma.meeting.deleteMany({})
  await prisma.transaction.deleteMany({}) // M-Pesa
  await prisma.income.deleteMany({})
  await prisma.ledgerTransaction.deleteMany({})
  await prisma.generalLedger.deleteMany({})
  await prisma.shareTransaction.deleteMany({})
  await prisma.workflowRequest.deleteMany({})

  // 4. Projections & Summaries
  console.log('Clearing projections and summaries...')
  await prisma.loanSummaryProjection.deleteMany({})
  await prisma.memberBalanceProjection.deleteMany({})
  await prisma.dailySummary.deleteMany({})

  // 5. Reset Balances
  console.log('Resetting cached balances...')
  
  // Reset LedgerAccount balances
  await prisma.ledgerAccount.updateMany({
    data: {
      balance: 0
    }
  })

  // Reset Member financial fields
  await prisma.member.updateMany({
    data: {
      shareContributions: 0,
      contributionArrears: 0,
      penaltyArrears: 0
    }
  })

  // Reset SaccoSettings balance
  await prisma.saccoSettings.updateMany({
    data: {
      welfareCurrentBalance: 0
    }
  })

  console.log('--- CLEANUP COMPLETED SUCCESSFULLY ---')
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
