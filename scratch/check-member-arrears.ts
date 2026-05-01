
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const memberId = 'cmnnjn2b30000tmlkh7gwf2i5'
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      name: true,
      contributionArrears: true,
      penaltyArrears: true,
      status: true
    }
  })
  console.log("Member info:", JSON.stringify(member, null, 2))

  const activeLoans = await prisma.loan.findMany({
    where: {
      memberId,
      status: { in: ['ACTIVE', 'OVERDUE'] }
    }
  })
  console.log("Active/Overdue loans count:", activeLoans.length)
  for (const l of activeLoans) {
      console.log(`- ID: ${l.id}, Num: ${l.loanApplicationNumber}, Status: ${l.status}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
