
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Checking LoanDraft table...")
  const drafts = await prisma.loanDraft.findMany({
    include: {
      user: true
    }
  })
  
  for (const draft of drafts) {
    const data = draft.data as any
    if (data.loanApplicationNumber === 'LN005' || data.referenceNo === 'LN005') {
       console.log("Found draft matching LN005:")
       console.log(JSON.stringify(draft, null, 2))
    }
  }

  console.log("\nChecking all active Loan titles for LN005...")
  const allLoans = await prisma.loan.findMany({
    select: { id: true, loanApplicationNumber: true, status: true }
  })
  console.log("All current loans:", allLoans)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
