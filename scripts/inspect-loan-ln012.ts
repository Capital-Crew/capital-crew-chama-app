import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function inspect() {
    try {
        const loan = await prisma.loan.findFirst({
            where: { loanApplicationNumber: 'LN012' },
            include: {
                transactions: true
            }
        })

        if (!loan) {
            console.error('Loan not found')
            return
        }

        console.log(`Loan ${loan.loanApplicationNumber} (${loan.id})`)
        console.log(`Status: ${loan.status}`)
        console.log(`Stored Balance: ${loan.outstandingBalance}`)

        console.log('\n--- Transactions ---')
        for (const tx of loan.transactions) {
            let ledgerTx = null
            if (tx.referenceId) {
                ledgerTx = await prisma.ledgerTransaction.findUnique({
                    where: { id: tx.referenceId }
                })
            }

            console.log(`[${tx.type}] ${tx.amount} | Reversed: ${tx.isReversed} | Ref: ${tx.referenceId}`)
            if (ledgerTx) {
                console.log(`    -> LedgerTx: ${ledgerTx.id} | Reversed: ${ledgerTx.isReversed}`)
                if (tx.isReversed !== ledgerTx.isReversed) {
                    console.log('    ⚠️  MISMATCH DETECTED!')
                }
            } else {
                if (tx.referenceId) console.log('    ⚠️  Ledger Tx NOT FOUND!')
            }
        }
    } catch (e) {
        console.error('Error inspecting:', e)
    }
}

inspect()
