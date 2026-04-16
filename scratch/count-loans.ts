
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.loan.count()
  console.log("Total loans in database:", count)

  const ln005s = await prisma.loan.findMany({
    where: {
      loanApplicationNumber: {
        contains: 'LN005'
      }
    }
  })
  console.log("Found matching LN005:", ln005s.length)
  for (const l of ln005s) {
    console.log(`- ID: ${l.id}, Num: ${l.loanApplicationNumber}, Status: ${l.status}, CreatedAt: ${l.createdAt}`)
  }

  // Also check if any LoanDrafts have this number set in their Json data
  const drafts = await prisma.loanDraft.findMany()
  console.log("Total drafts:", drafts.length)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
