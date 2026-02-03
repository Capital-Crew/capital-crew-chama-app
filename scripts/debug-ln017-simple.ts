import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN017' }
    })

    if (!loan) {
        console.log('Loan not found')
        return
    }

    const tx = await prisma.loanTransaction.findFirst({
        where: { loanId: loan.id, type: 'REPAYMENT' }
    })

    if (!tx) {
        console.log('No repayment found')
        return
    }

    console.log(`Repayment Ref: ${tx.referenceId}`)

    const ltx = await prisma.ledgerTransaction.findUnique({
        where: { id: tx.referenceId! },
        include: { lines: { include: { ledgerAccount: true } } }
    })

    console.log(`Ledger TX Ref: ${ltx?.referenceId}`)

    ltx?.lines.forEach(l => {
        console.log(`Line: ${l.description} | ${l.ledgerAccount.type} | DR: ${l.debitAmount} | CR: ${l.creditAmount}`)
    })
}

run()
