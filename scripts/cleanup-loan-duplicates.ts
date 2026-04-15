
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Loan Data Cleanup...')

  // 1. Cleanup Stale LoanDrafts (The temporary per-user draft table)
  console.log('--- Cleaning up LoanDraft table ---')
  const drafts = await prisma.loanDraft.findMany({
    include: {
      user: {
        select: {
          id: true,
          memberId: true,
          name: true
        }
      }
    }
  })

  let draftCleanupCount = 0

  for (const draft of drafts) {
    if (!draft.user?.memberId) continue

    // Check if this member already has a pending or active loan
    const activeLoan = await prisma.loan.findFirst({
      where: {
        memberId: draft.user.memberId,
        status: {
          in: ['PENDING_APPROVAL', 'APPROVED', 'DISBURSED', 'ACTIVE', 'CLEARED', 'OVERDUE']
        }
      },
      orderBy: { applicationDate: 'desc' }
    })

    if (activeLoan) {
      // If the loan was created/updated AFTER the draft, or even if it exists
      // we usually don't want a draft lingering for a submitted loan.
      console.log(`🗑️ Deleting stale LoanDraft for user ${draft.user.name} (Member: ${draft.user.memberId}) - Found active loan ${activeLoan.loanApplicationNumber}`)
      await prisma.loanDraft.delete({ where: { id: draft.id } })
      draftCleanupCount++
    }
  }

  // 2. Cleanup Duplicate 'APPLICATION' Status Loans (Stale drafts in the main Loan table)
  console.log('\n--- Cleaning up Loan table duplicates (status: APPLICATION) ---')
  const applicationLoans = await prisma.loan.findMany({
    where: { status: 'APPLICATION' }
  })

  let loanCleanupCount = 0

  for (const appLoan of applicationLoans) {
    // Check if there's a PENDING_APPROVAL loan for the same member that is effectively the same application
    const duplicate = await prisma.loan.findFirst({
      where: {
        memberId: appLoan.memberId,
        status: 'PENDING_APPROVAL',
        // Match on product and amount as heuristic for being the same application
        loanProductId: appLoan.loanProductId,
        amount: appLoan.amount,
        id: { not: appLoan.id }
      }
    })

    if (duplicate) {
      console.log(`🗑️ Deleting duplicate APPLICATION loan ${appLoan.loanApplicationNumber} for member ${appLoan.memberId} - Real application is ${duplicate.loanApplicationNumber}`)
      await prisma.loan.delete({ where: { id: appLoan.id } })
      loanCleanupCount++
    }
  }

  console.log('\n✅ Cleanup Complete!')
  console.log(`Summary:`)
  console.log(`- Stale LoanDrafts removed: ${draftCleanupCount}`)
  console.log(`- Duplicate APPLICATION loans removed: ${loanCleanupCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
