import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugLedger() {
    console.log('🔍 Debugging LN017 Ledger Links...\n')

    // 1. Get the Repayment transaction
    const repaymentTx = await prisma.loanTransaction.findFirst({
        where: {
            loan: { loanApplicationNumber: 'LN017' },
            type: 'REPAYMENT'
        },
        include: { loan: true }
    })

    if (!repaymentTx || !repaymentTx.referenceId) {
        console.log('No linked repayment found')
        return
    }

    console.log(`Repayment TX: ${repaymentTx.id}, Amount: ${repaymentTx.amount}`)
    console.log(`Linked Ledger TX: ${repaymentTx.referenceId}`)

    // 2. Fetch the Ledger Transaction
    const ledgerTx = await prisma.ledgerTransaction.findUnique({
        where: { id: repaymentTx.referenceId },
        include: {
            lines: {
                include: { ledgerAccount: true }
            }
        }
    })

    if (!ledgerTx) {
        console.log('Ledger Transaction not found')
        return
    }

    console.log(`\nLedger Transaction: ${ledgerTx.description}`)
    console.log(`Reference ID: ${ledgerTx.referenceId}`)

    console.log('\nLINES:')
    let assetSum = 0
    ledgerTx.lines.forEach(line => {
        const isAsset = line.ledgerAccount.type === 'ASSET'
        console.log(`- [${line.ledgerAccount.code}] ${line.ledgerAccount.name} (${line.ledgerAccount.type})`)
        console.log(`  DR: ${line.debitAmount} | CR: ${line.creditAmount}`)
        console.log(`  Desc: ${line.description}`)

        if (isAsset) {
            assetSum += (Number(line.debitAmount) - Number(line.creditAmount))
            console.log(`  => Asset Impact: ${Number(line.debitAmount) - Number(line.creditAmount)}`)
        }
    })

    console.log(`\nTotal Asset Impact from this TX: ${assetSum}`)
}

debugLedger()
