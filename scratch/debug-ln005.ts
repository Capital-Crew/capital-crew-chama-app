
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Searching for ALL loans with LN005...")
  const loans = await prisma.loan.findMany({
    where: { loanApplicationNumber: 'LN005' }
  })
  console.log("Loans found:", JSON.stringify(loans, null, 2))

  console.log("\nSearching for LN005 with case-insensitivity...")
  const loansInsensitive = await prisma.loan.findMany({
    where: {
      loanApplicationNumber: {
        contains: 'LN005',
        mode: 'insensitive'
      }
    }
  })
  console.log("In-sensitive matches:", JSON.stringify(loansInsensitive, null, 2))

  console.log("\nChecking for WorkflowRequests for any of these loans...")
  for (const l of loansInsensitive) {
      const wfs = await prisma.workflowRequest.findMany({
          where: { entityId: l.id }
      })
      console.log(`WFs for ${l.id} (${l.loanApplicationNumber}):`, JSON.stringify(wfs, null, 2))
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
