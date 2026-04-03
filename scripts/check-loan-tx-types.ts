import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkLoanTransactions() {
  const loans = await prisma.loan.findMany({
    where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
    include: {
        transactions: true,
        member: true
    }
  })

  console.log(`Found ${loans.length} active/overdue loans.\n`)

  loans.forEach(l => {
    console.log(`Member: ${l.member.name} | Loan: ${l.loanApplicationNumber} | Amount: ${l.amount}`)
    l.transactions.forEach(t => {
        console.log(`  - Type: ${t.type} | Amount: ${t.amount} | Date: ${t.postedAt}`)
    })
    console.log('---')
  })
}

checkLoanTransactions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
