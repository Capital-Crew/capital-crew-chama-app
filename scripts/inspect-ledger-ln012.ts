import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function inspectLedger() {
    const txId = 'cml3hdsjg00mhtm14g4m68062' // The Repayment Ledger Transaction ID

    const tx = await prisma.ledgerTransaction.findUnique({
        where: { id: txId },
        include: {
            ledgerEntries: {
                include: { ledgerAccount: true }
            }
        }
    })

    if (!tx) {
        console.log('Ledger Tx NOT FOUND')
        return
    }

    console.log(`Ledger Tx: ${tx.id} | Ref: ${tx.referenceId} | Type: ${tx.referenceType}`)
    console.log('Entries:')
    tx.ledgerEntries.forEach(entry => {
        console.log(`  [${entry.ledgerAccount.code} - ${entry.ledgerAccount.name} (${entry.ledgerAccount.type})] DR: ${entry.debitAmount} | CR: ${entry.creditAmount}`)
    })
}

inspectLedger()
