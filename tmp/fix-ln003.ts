
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const loanNo = 'LN003'
    const ledgerTxId = 'cmnle0y4v000atm94xx2r31qi'

    console.log(`🚀 Starting data correction for ${loanNo}...`)

    await prisma.$transaction(async (tx) => {
        // 1. Fetch Loan
        const loan = await tx.loan.findFirst({
            where: { loanApplicationNumber: loanNo },
            include: { repaymentInstallments: { orderBy: { installmentNumber: 'asc' } } }
        })

        if (!loan) throw new Error('Loan not found')

        // 2. Fix Installment #1
        const inst1 = loan.repaymentInstallments.find(i => i.installmentNumber === 1)
        if (inst1) {
            console.log(`Updating Installment #1: Setting P Paid to 7500, Pen Due/Paid to 0`)
            await tx.repaymentInstallment.update({
                where: { id: inst1.id },
                data: {
                    principalPaid: new Prisma.Decimal(7500),
                    penaltyDue: new Prisma.Decimal(0),
                    penaltyPaid: new Prisma.Decimal(0),
                    isFullyPaid: true
                }
            })
        }

        // 3. Fix Loan Transaction
        const loanTx = await tx.loanTransaction.findFirst({
            where: { referenceId: ledgerTxId }
        })
        if (loanTx) {
            console.log(`Updating Loan Transaction ${loanTx.id}: Setting P amount to 7500, Pen amount to 0`)
            await tx.loanTransaction.update({
                where: { id: loanTx.id },
                data: {
                    principalAmount: new Prisma.Decimal(7500),
                    penaltyAmount: new Prisma.Decimal(0)
                }
            })
        }

        // 4. Fix Ledger Entries
        // Entry for 1310 (Principal Receivable) -> increase to 7500
        // Entry for 1023 (Penalty Receivable) -> set to 0
        console.log(`Updating Ledger Entries for ${ledgerTxId}`)
        
        // Find the Penalty Entry (usually 1023 or whatever we saw)
        await tx.ledgerEntry.updateMany({
            where: {
                ledgerTransactionId: ledgerTxId,
                ledgerAccount: { code: '1023' }
            },
            data: { creditAmount: new Prisma.Decimal(0) }
        })

        await tx.ledgerEntry.updateMany({
            where: {
                ledgerTransactionId: ledgerTxId,
                ledgerAccount: { code: '1310' }
            },
            data: { creditAmount: new Prisma.Decimal(7500) }
        })

        // 5. Re-sync Loan Counters
        // loan.penalties should be 0 (if the previous reversal worked)
        // loan.current_balance should be correct for a 30k loan with 7.5k paid = 22.5k
        console.log(`Re-syncing Loan Counters`)
        await tx.loan.update({
            where: { id: loan.id },
            data: {
                penalties: new Prisma.Decimal(0),
                current_balance: new Prisma.Decimal(22500)
            }
        })
    })

    console.log('✅ LN003 Data Correction Complete')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
