import { PrismaClient } from '@prisma/client'
import { RepaymentCalculator } from '../lib/utils/repayment-calculator'

const db = new PrismaClient()

async function main() {
    console.log('--- REGENERATING REPAYMENT SCHEDULES WITH CORRECT INTEREST ---')

    const loans = await db.loan.findMany({
        where: { status: { in: ['ACTIVE', 'DISBURSED'] } },
        include: { loanProduct: true, repaymentInstallments: true }
    })

    // Filter: product rate differs from stored rate
    const toFix = loans.filter(l => {
        const productRate = parseFloat((l.loanProduct as any)?.interestRatePerPeriod?.toString() ?? '0')
        const storedRate = parseFloat(l.interestRate?.toString() ?? '0')
        return productRate !== storedRate
    })

    if (toFix.length === 0) {
        console.log('✅ All loans already have matching interest rates. Nothing to fix.')
        return
    }

    for (const loan of toFix) {
        const productRate = parseFloat((loan.loanProduct as any)?.interestRatePerPeriod?.toString() ?? '0')
        const disbDate = loan.disbursementDate ?? loan.applicationDate ?? new Date()

        console.log(`\nFixing: ${loan.loanApplicationNumber}`)
        console.log(`  Stored rate:  ${loan.interestRate}% (WRONG)`)
        console.log(`  Product rate: ${productRate}% (CORRECT)`)

        await db.$transaction(async (tx) => {
            // 1. Correct the stored rate on the loan itself
            await tx.loan.update({
                where: { id: loan.id },
                data: { interestRate: productRate }
            })
            console.log(`  ✅ loan.interestRate updated → ${productRate}%`)

            // 2. Delete old (wrong) schedule
            const deleted = await tx.repaymentInstallment.deleteMany({ where: { loanId: loan.id } })
            console.log(`  ✅ Deleted ${deleted.count} old installment(s)`)

            // 3. Regenerate correctly from historical disbursement date
            const schedule = RepaymentCalculator.generateSchedule(
                loan.id,
                {
                    principal: Number(loan.amount),
                    interestRatePerMonth: productRate,
                    installments: loan.installments,
                    amortizationType: (loan.loanProduct?.amortizationType as any) || 'EQUAL_INSTALLMENTS'
                },
                disbDate
            )

            await tx.repaymentInstallment.createMany({
                data: schedule.map(item => ({ ...item, loanId: loan.id }))
            })

            console.log(`  ✅ New schedule (${schedule.length} installments):`)
            schedule.forEach(s => {
                const principal = Number(s.principalDue).toLocaleString()
                const interest  = Number(s.interestDue).toLocaleString()
                const total     = (Number(s.principalDue) + Number(s.interestDue)).toLocaleString()
                console.log(`     #${s.installmentNumber} | Due: ${s.dueDate.toISOString().split('T')[0]} | Principal: KES ${principal} | Interest: KES ${interest} | Total: KES ${total}`)
            })
        })

        console.log(`  ✅ ${loan.loanApplicationNumber} repaired.`)
    }

    console.log('\n--- DONE ---')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => db.$disconnect())
