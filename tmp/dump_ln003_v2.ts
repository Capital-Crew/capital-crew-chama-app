
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN003' },
        include: {
            repaymentInstallments: {
                orderBy: { installmentNumber: 'asc' }
            },
            transactions: {
                orderBy: { postedAt: 'desc' },
                take: 5
            }
        }
    })

    if (!loan) {
        console.log('Loan not found')
        return
    }

    console.log('Loan Info:', {
        id: loan.id,
        loanNo: loan.loanApplicationNumber,
        status: loan.status,
        penaltiesCounter: loan.penalties.toString(),
        currentBalance: loan.current_balance.toString()
    })

    console.log('\nInstallments:')
    loan.repaymentInstallments.forEach(i => {
        console.log(`Inst #${i.installmentNumber} | Due: ${i.dueDate.toISOString().split('T')[0]} | P: ${i.principalDue}/${i.principalPaid} | I: ${i.interestDue}/${i.interestPaid} | Pen: ${i.penaltyDue}/${i.penaltyPaid} | Status: ${i.isFullyPaid ? 'PAID' : 'UNPAID'}`)
    })

    console.log('\nRecent Transactions:')
    loan.transactions.forEach(t => {
        console.log(`${t.postedAt.toISOString()} | ${t.type} | Amount: ${t.amount} | P: ${t.principalAmount} | I: ${t.interestAmount} | Pen: ${t.penaltyAmount} | Ref: ${t.referenceId}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
