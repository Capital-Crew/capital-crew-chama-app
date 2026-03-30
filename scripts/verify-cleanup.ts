import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userCount = await prisma.user.count()
  const loanCount = await prisma.loan.count()
  const expenseCount = await prisma.expense.count()
  const transactionCount = await prisma.ledgerTransaction.count()
  const ledgerAccountCount = await prisma.ledgerAccount.count()
  
  // Check a few ledger balances
  const accounts = await prisma.ledgerAccount.findMany({
    take: 5,
    select: { name: true, balance: true }
  })

  console.log('--- VERIFICATION RESULTS ---')
  console.log(`User Count: ${userCount} (Should be > 0)`)
  console.log(`Loan Count: ${loanCount} (Should be 0)`)
  console.log(`Expense Count: ${expenseCount} (Should be 0)`)
  console.log(`Transaction Count: ${transactionCount} (Should be 0)`)
  console.log(`Ledger Account Structure Count: ${ledgerAccountCount} (Should be > 0)`)
  console.log('Sample Ledger Balances:')
  accounts.forEach(a => console.log(`- ${a.name}: ${a.balance}`))
}

main()
  .catch((e) => {
    console.error('Error during verification:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
