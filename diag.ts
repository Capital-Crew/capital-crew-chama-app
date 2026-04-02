import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkData() {
    console.log('--- Delinquent Loans Check ---')
    const delinquent = await prisma.repaymentInstallment.findMany({
        where: {
            dueDate: { lt: new Date() },
            isFullyPaid: false,
            loan: { status: { in: ['ACTIVE', 'OVERDUE'] } }
        },
        include: { loan: { include: { member: true } } }
    })
    console.log(`Found ${delinquent.length} delinquent installments.`)
    if (delinquent.length > 0) {
        console.log('Sample delinquent loan:', delinquent[0].loan.loanApplicationNumber)
    }

    console.log('\n--- Contribution Arrears Check ---')
    const missed = await prisma.monthlyTracker.findMany({
        where: {
            balance: { gt: 0 },
            month: { lte: new Date() }
        },
        include: { member: true }
    })
    console.log(`Found ${missed.length} non-zero monthly trackers.`)
    if (missed.length > 0) {
        console.log('Sample arrear member:', missed[0].member.name, 'Amount:', missed[0].balance)
    }
    console.log('\n--- Totals Check ---')
    const contributionsAgg = await prisma.ledgerEntry.aggregate({
        where: {
            ledgerAccount: { systemMappings: { some: { type: 'CONTRIBUTIONS' } } },
        },
        _sum: { debitAmount: true, creditAmount: true }
    })
    const totalConts = Number(contributionsAgg._sum.creditAmount || 0) - Number(contributionsAgg._sum.debitAmount || 0)
    console.log('Total Contributions (Ledger):', totalConts)

    const loanPortfolioAgg = await prisma.ledgerAccount.aggregate({
        where: {
            productMappings: { some: { accountType: 'LOAN_PORTFOLIO' } }
        },
        _sum: { balance: true }
    })
    const totalLoans = Number(loanPortfolioAgg._sum.balance || 0)
    console.log('Total Outstanding Loans (Ledger):', totalLoans)
}

checkData().finally(() => prisma.$disconnect())
