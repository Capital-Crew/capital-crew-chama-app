import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const loans = await db.loan.findMany({
        where: { status: { in: ['ACTIVE', 'DISBURSED'] } },
        include: {
            repaymentInstallments: { orderBy: { installmentNumber: 'asc' } },
            loanProduct: true,
        }
    })

    for (const loan of loans) {
        console.log(`\n=== Loan: ${loan.loanApplicationNumber} ===`)
        console.log(`  Amount:       KES ${Number(loan.amount).toLocaleString()}`)
        console.log(`  Installments: ${loan.installments} months`)
        console.log(`  Interest:     ${loan.interestRate}%`)
        console.log(`  Disburse Date:${loan.disbursementDate?.toISOString().split('T')[0]}`)
        console.log(`  Product Amort:${loan.loanProduct?.amortizationType}`)
        console.log(`  Schedule entries: ${loan.repaymentInstallments.length}`)
        
        loan.repaymentInstallments.forEach(inst => {
            console.log(`  #${inst.installmentNumber} Due: ${inst.dueDate.toISOString().split('T')[0]} | Principal: ${inst.principalDue} | Interest: ${inst.interestDue} | Paid: ${inst.isFullyPaid}`)
        })
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => db.$disconnect())
