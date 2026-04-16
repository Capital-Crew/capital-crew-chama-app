
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const loan = await prisma.loan.findFirst({
    where: { loanApplicationNumber: 'LN005' },
    include: {
      approvals: true,
      workflowRequests: {
        include: {
          approvals: true
        }
      }
    }
  })
  console.log(JSON.stringify(loan, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
