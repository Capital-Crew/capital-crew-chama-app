
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN003' },
        include: {
            repaymentInstallments: {
                orderBy: { installmentNumber: 'asc' }
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
        console.log(`Inst #${i.installmentNumber} | Due: ${i.dueDate.toISOString().split('T')[0]} | P Due: ${i.principalDue} | I Due: ${i.interestDue} | Penalty Due: ${i.penaltyDue} | Penalty Paid: ${i.penaltyPaid} | Status: ${i.isFullyPaid ? 'PAID' : 'UNPAID'}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
