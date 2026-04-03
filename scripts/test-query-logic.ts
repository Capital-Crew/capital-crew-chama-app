import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  const [loansAmountAgg, repaymentsAgg] = await Promise.all([
    prisma.loan.aggregate({
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
        _sum: { amount: true }
    }),
    prisma.loanTransaction.aggregate({
      where: {
        type: { in: ['REPAYMENT', 'PRINCIPAL_PAYMENT'] },
        loan: { status: { in: ['ACTIVE', 'OVERDUE'] } }
      },
      _sum: { amount: true }
    })
  ])

  console.log('Loans Amount Agg:', loansAmountAgg._sum.amount)
  console.log('Repayments Agg:', repaymentsAgg._sum.amount)
  
  const outstandingLoans = Number(loansAmountAgg._sum.amount || 0) - Number(repaymentsAgg._sum.amount || 0)
  console.log('Calculated Outstanding Loans:', outstandingLoans)
}

test().catch(console.error).finally(() => prisma.$disconnect())
