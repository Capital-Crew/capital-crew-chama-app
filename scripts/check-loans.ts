import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkLoans() {
  // 1. Check Global Loan Portfolio Balance
  const loanAccounts = await prisma.ledgerAccount.findMany({
    where: {
        productMappings: { some: { accountType: 'LOAN_PORTFOLIO' } }
    },
    select: { code: true, name: true, balance: true }
  })
  
  console.log('--- GLOBAL LOAN PORTFOLIO ACCOUNTS ---')
  loanAccounts.forEach(a => {
    console.log(`Account ${a.code} (${a.name}): Balance = ${a.balance}`)
  })

  // 2. Check Specific Member Loans (using Geoffrey Mwangi or similar if they have loans)
  const memberWithLoans = await prisma.member.findFirst({
    where: {
        loans: { some: { status: { in: ['ACTIVE', 'OVERDUE'] } } }
    },
    include: {
        loans: {
            where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
            include: {
                transactions: true
            }
        }
    }
  })

  if (memberWithLoans) {
    console.log(`\n--- MEMBER LOANS: ${memberWithLoans.name} (${memberWithLoans.id}) ---`)
    memberWithLoans.loans.forEach(l => {
        console.log(`Loan ${l.loanApplicationNumber}: Status=${l.status}, Amount=${l.amount}`)
        console.log(`Transactions: ${l.transactions.length}`)
        const totalPaid = l.transactions.reduce((sum, t) => sum + (t.type === 'REPAYMENT' ? Number(t.amount) : 0), 0)
        console.log(`Total Repayments Found: ${totalPaid}`)
    })
  } else {
    console.log('\nNo members found with ACTIVE/OVERDUE loans in the Loan table.')
  }
}

checkLoans()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
