import { PrismaClient, Prisma, LoanStatus } from '@prisma/client'
import { RepaymentCalculator } from '../lib/utils/repayment-calculator'

const db = new PrismaClient()

async function main() {
    console.log('--- REVIEWING & REPAIRING LOADED LOANS ---')

    // Find all loans that were loaded via Direct Loader (DISBURSED or ACTIVE)
    // that are missing repayment schedules
    const loansToRepair = await db.loan.findMany({
        where: {
            status: { in: ['DISBURSED', 'ACTIVE'] },
            repaymentInstallments: { none: {} } // Missing schedule
        },
        include: {
            loanProduct: true,
            transactions: true,
        }
    })

    if (loansToRepair.length === 0) {
        console.log('✅ No loans need repair. All loaded loans already have repayment schedules.')
        return
    }

    console.log(`Found ${loansToRepair.length} loan(s) needing repair:`)
    loansToRepair.forEach(l => console.log(`  - ${l.loanApplicationNumber} | Status: ${l.status} | Amount: ${l.amount}`))

    for (const loan of loansToRepair) {
        console.log(`\nRepairing loan ${loan.loanApplicationNumber}...`)
        
        const interestRate = parseFloat(loan.interestRate?.toString() ?? '0')
        const disbDate = loan.disbursementDate ?? loan.applicationDate ?? new Date()
        const product = loan.loanProduct

        await db.$transaction(async (tx) => {
            // 1. Fix status: Set to ACTIVE
            if (loan.status === 'DISBURSED') {
                await tx.loan.update({
                    where: { id: loan.id },
                    data: { status: LoanStatus.ACTIVE }
                })
                console.log(`  ✅ Status updated: DISBURSED → ACTIVE`)
            } else {
                console.log(`  ✅ Status already ACTIVE, skipping.`)
            }

            // 2. Generate repayment schedule
            const scheduleData = RepaymentCalculator.generateSchedule(
                loan.id,
                {
                    principal: Number(loan.amount),
                    interestRatePerMonth: interestRate,
                    installments: loan.installments,
                    amortizationType: (product?.amortizationType as any) || 'EQUAL_INSTALLMENTS'
                },
                disbDate
            )

            await tx.repaymentInstallment.createMany({
                data: scheduleData.map(item => ({
                    ...item,
                    loanId: loan.id
                }))
            })
            console.log(`  ✅ Repayment schedule created: ${scheduleData.length} installments`)

            // 3. Delete old "Initial disbursement" entry and replace with Balance B/F
            const deletedOld = await tx.loanTransaction.deleteMany({
                where: {
                    loanId: loan.id,
                    description: { contains: 'disbursement for pre-approved loan' }
                }
            })
            if (deletedOld.count > 0) {
                console.log(`  ✅ Deleted ${deletedOld.count} old "Initial disbursement" entry(s)`)
            }

            // Check if a correct B/F entry already exists
            const hasBFEntry = loan.transactions.some(t =>
                t.description?.includes('Balance B/F')
            )

            if (!hasBFEntry) {
                await tx.loanTransaction.create({
                    data: {
                        loanId: loan.id,
                        type: 'DISBURSEMENT',
                        amount: new Prisma.Decimal(Number(loan.amount)),
                        principalAmount: new Prisma.Decimal(Number(loan.amount)),
                        description: `Balance B/F — Migrated existing loan`,
                        transactionDate: disbDate,
                        postedAt: disbDate,
                    }
                })
                console.log(`  ✅ Balance B/F entry created`)
            } else {
                console.log(`  ✅ Balance B/F entry already exists, skipping.`)
            }


            // 4. Ensure Journey Event exists
            await tx.loanJourneyEvent.create({
                data: {
                    loanId: loan.id,
                    eventType: 'LOAN_DISBURSED',
                    description: `Loan repaired & activated via migration repair script. Balance B/F: KES ${Number(loan.amount).toLocaleString()}`,
                    actorId: 'SYSTEM',
                    actorName: 'Migration Repair Script',
                }
            })
            console.log(`  ✅ Journey event created`)
        })

        console.log(`  ✅ Loan ${loan.loanApplicationNumber} fully repaired.`)
    }

    console.log('\n--- REPAIR COMPLETED SUCCESSFULLY ---')
}

main()
    .catch((e) => {
        console.error('Error during repair:', e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
