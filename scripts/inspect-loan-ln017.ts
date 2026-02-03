import { PrismaClient } from '@prisma/client'
import { getLoanOutstandingBalance } from '../lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

async function inspectLoan() {
    console.log('🔍 Inspecting LN017...\n')

    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN017' },
        include: {
            transactions: {
                orderBy: { postedAt: 'asc' }
            },
            repaymentInstallments: true
        }
    })

    if (!loan) {
        console.error('Loan not found')
        return
    }

    console.log(`Loan ID: ${loan.id}`)
    console.log(`Status: ${loan.status}`)
    console.log(`Amount: ${loan.amount}`)
    console.log(`Stored Balance: ${loan.outstandingBalance}`)

    const ledgerBalance = await getLoanOutstandingBalance(loan.id)
    console.log(`Ledger Balance: ${ledgerBalance}\n`)

    console.log('=== TRANSACTIONS ===')
    let runningTotal = 0
    loan.transactions.forEach(tx => {
        let amount = Number(tx.amount)
        if (tx.type === 'REPAYMENT' || tx.type === 'WAIVER') amount = -amount
        runningTotal += amount
        console.log(`${tx.postedAt.toISOString().split('T')[0]} | ${tx.type.padEnd(12)} | ${Number(tx.amount).toFixed(2).padStart(10)} | Ref: ${tx.referenceId ? 'YES' : 'NO'}`)
    })

    console.log(`\nTransaction Sum: ${runningTotal.toFixed(2)}`)

    console.log('\n=== INSTALLMENTS ===')
    const paidInstallments = loan.repaymentInstallments.filter(i => i.isFullyPaid)
    console.log(`Fully Paid Installments: ${paidInstallments.length} / ${loan.repaymentInstallments.length}`)
}

inspectLoan()
