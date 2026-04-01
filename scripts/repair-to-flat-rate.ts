import { PrismaClient, Prisma } from '@prisma/client'
import { generateRepaymentSchedule } from '../lib/loan-calculator'

const db = new PrismaClient()

async function main() {
    console.log('--- REPAIRING LOADED LOANS: SWITCHING TO FLAT RATE ---')

    const loans = await db.loan.findMany({
        where: { status: { in: ['ACTIVE', 'DISBURSED'] } },
        include: {
            loanProduct: true,
            repaymentInstallments: true,
        }
    })

    if (loans.length === 0) {
        console.log('✅ No active/disbursed loans found.')
        return
    }

    for (const loan of loans) {
        const product = loan.loanProduct
        if (!product) {
            console.log(`⚠️  Loan ${loan.loanApplicationNumber} has no product — skipping.`)
            continue
        }

        const interestType   = (product.interestType as 'FLAT' | 'DECLINING_BALANCE') ?? 'DECLINING_BALANCE'
        const amortType      = (product.amortizationType as 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL') ?? 'EQUAL_INSTALLMENTS'
        const monthlyRate    = parseFloat(product.interestRatePerPeriod?.toString() ?? '0')
        const principal      = Number(loan.amount)
        const disbDate       = loan.disbursementDate ?? loan.applicationDate ?? new Date()

        console.log(`\nLoan: ${loan.loanApplicationNumber}`)
        console.log(`  Product:      ${product.name}`)
        console.log(`  InterestType: ${interestType}`)
        console.log(`  AmortType:    ${amortType}`)
        console.log(`  Rate:         ${monthlyRate}% p.m.`)
        console.log(`  Principal:    KES ${principal.toLocaleString()}`)

        const schedule = generateRepaymentSchedule(
            { principal, interestRatePerMonth: monthlyRate, installments: loan.installments, amortizationType: amortType, interestType },
            disbDate
        )

        const totalOutstanding = schedule.reduce((s, i) => s + i.principalDue + i.interestDue, 0)

        console.log(`  Total Repayable: KES ${totalOutstanding.toLocaleString()}`)
        console.log(`  New schedule preview:`)
        schedule.forEach(s => {
            console.log(`    #${s.installmentNumber} | Due: ${s.dueDate.toISOString().split('T')[0]} | Principal: KES ${s.principalDue.toLocaleString()} | Interest: KES ${s.interestDue.toLocaleString()} | Total: KES ${s.totalDue.toLocaleString()}`)
        })

        await db.$transaction(async (tx) => {
            // 1. Delete old schedule
            const deleted = await tx.repaymentInstallment.deleteMany({ where: { loanId: loan.id } })
            console.log(`  ✅ Deleted ${deleted.count} old installment(s)`)

            // 2. Insert new flat-rate schedule
            await tx.repaymentInstallment.createMany({
                data: schedule.map(item => ({
                    loanId: loan.id,
                    installmentNumber: item.installmentNumber,
                    dueDate: item.dueDate,
                    principalDue: new Prisma.Decimal(item.principalDue),
                    interestDue:  new Prisma.Decimal(item.interestDue),
                    principalPaid: new Prisma.Decimal(0),
                    interestPaid:  new Prisma.Decimal(0),
                    penaltyDue:    new Prisma.Decimal(0),
                    penaltyPaid:   new Prisma.Decimal(0),
                    isFullyPaid: false
                }))
            })
            console.log(`  ✅ Inserted ${schedule.length} new installment(s)`)

            // 3. Update loan's interestRate, interestRatePerMonth, and outstandingBalance
            await tx.loan.update({
                where: { id: loan.id },
                data: {
                    interestRate: monthlyRate,
                    interestRatePerMonth: monthlyRate,
                    outstandingBalance: totalOutstanding,
                    current_balance: totalOutstanding,
                }
            })
            console.log(`  ✅ Outstanding balance updated to KES ${totalOutstanding.toLocaleString()}`)
        })

        console.log(`  ✅ ${loan.loanApplicationNumber} repaired.`)
    }

    console.log('\n--- REPAIR COMPLETED ---')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => db.$disconnect())
