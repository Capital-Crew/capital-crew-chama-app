import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const loanNo = 'LN004'
    const newStartDate = new Date('2026-03-02T00:00:00Z')
    
    console.log(`🛠️ Starting data correction for ${loanNo}...`)

    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanNo },
        include: { 
            transactions: { orderBy: { postedAt: 'asc' } },
            repaymentInstallments: { orderBy: { installmentNumber: 'asc' } }
        }
    })

    if (!loan) throw new Error('Loan not found')

    // 1. Sync missing Penalties into LoanTransaction
    const penaltyLedgerTxs = [
        { id: 'cmnfa8vdl000cju04b750qnzb', date: new Date('2026-04-01T00:03:26.364Z'), amt: 540 },
        { id: 'cmnjmjgz80000kv04rlobya3f', date: new Date('2026-04-04T00:58:40.916Z'), amt: 540 }
    ]

    for (const p of penaltyLedgerTxs) {
        const exists = await prisma.loanTransaction.findFirst({ where: { referenceId: p.id } })
        if (!exists) {
            console.log(`  + Syncing Penalty: ${p.id} (${p.amt})`)
            await prisma.loanTransaction.create({
                data: {
                    loanId: loan.id,
                    type: 'PENALTY',
                    amount: new Prisma.Decimal(p.amt),
                    postedAt: p.date,
                    transactionDate: p.date,
                    description: `Penalty Applied - ${loanNo}`,
                    referenceId: p.id,
                    penaltyAmount: p.amt
                }
            })
        }
    }

    // 2. Update Loan Dates
    console.log(`  > Updating Loan dates to ${newStartDate.toISOString()}`)
    await prisma.loan.update({
        where: { id: loan.id },
        data: {
            applicationDate: newStartDate,
            disbursementDate: newStartDate
        }
    })

    // 3. Update Disbursement Transaction Dates
    const disTx = loan.transactions.find(t => t.type === 'DISBURSEMENT')
    if (disTx) {
        console.log(`  > Updating Disbursement LoanTransaction to ${newStartDate.toISOString()}`)
        await prisma.loanTransaction.update({
            where: { id: disTx.id },
            data: {
                postedAt: newStartDate,
                transactionDate: newStartDate
            }
        })
        
        if (disTx.referenceId) {
            console.log(`  > Updating Disbursement LedgerTransaction to ${newStartDate.toISOString()}`)
            await prisma.ledgerTransaction.update({
                where: { id: disTx.referenceId },
                data: {
                    postedAt: newStartDate,
                    transactionDate: newStartDate
                }
            })
        }
    }

    // 4. Shift Repayment Schedule (to 2nd of each month starting April)
    console.log(`  > Shifting schedule to 2nd of each month (UTC)...`)
    const monthOffsets = [1, 2, 3, 4] // April, May, June, July
    for (const inst of loan.repaymentInstallments) {
        const offset = monthOffsets[inst.installmentNumber - 1]
        // 2026, Month (3=April), Day (2)
        const newDueDate = new Date(Date.UTC(2026, 2 + offset, 2, 0, 0, 0))
        
        console.log(`    Inst #${inst.installmentNumber}: ${inst.dueDate.toISOString().split('T')[0]} -> ${newDueDate.toISOString().split('T')[0]}`)
        await prisma.repaymentInstallment.update({
            where: { id: inst.id },
            data: { dueDate: newDueDate }
        })
    }

    // 5. Final Replay
    console.log(`🚀 Triggering Replay for ${loanNo}...`)
    const { TransactionReplayService } = await import('../lib/services/TransactionReplayService')
    await TransactionReplayService.replayTransactions(loan.id, newStartDate)

    console.log(`✅ ${loanNo} corrected and re-synced.`)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
