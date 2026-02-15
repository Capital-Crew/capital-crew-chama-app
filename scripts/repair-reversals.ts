
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Starting Enhanced Reversal Repair Script ---')

    // 1. Fetch ALL valid loan transactions to check against Ledger
    const allLoanTxs = await prisma.loanTransaction.findMany({
        where: { isReversed: false, type: { in: ['REPAYMENT', 'DISBURSEMENT'] } },
        include: { loan: true }
    })

    console.log(`Checking ${allLoanTxs.length} active transactions for Ledger discrepancies...`)
    let fixedCount = 0

    for (const tx of allLoanTxs) {
        // Find the Ledger Entry for this Loan Tx
        const ledgerEntry = await prisma.ledgerTransaction.findFirst({
            where: { externalReferenceId: tx.id }
        })

        if (!ledgerEntry) continue

        // Check if the Ledger Entry is reversed or has a reversal linked
        // Scenario A: LedgerEntry is marked reversed
        // Scenario B: There exists a LedgerEntry with reversalOf == ledgerEntry.id
        const isLedgerReversed = ledgerEntry.isReversed
            || (await prisma.ledgerTransaction.findFirst({ where: { reversalOf: ledgerEntry.id } }))

        if (isLedgerReversed) {
            console.log(`[MISMATCH FOUND] Tx ${tx.id} (${tx.type}) is Active, but Ledger is Reversed. Fixing...`)

            // 1. Mark LoanTx as Reversed
            await prisma.loanTransaction.update({
                where: { id: tx.id },
                data: { isReversed: true, reversedAt: new Date() }
            })

            // 2. Create Contra Entry
            await prisma.loanTransaction.create({
                data: {
                    loanId: tx.loanId,
                    type: 'REVERSAL',
                    amount: tx.amount,
                    principalAmount: tx.principalAmount,
                    interestAmount: tx.interestAmount,
                    penaltyAmount: tx.penaltyAmount,
                    feeAmount: tx.feeAmount,
                    description: `Reversal: ${tx.type} (Sync Repair)`,
                    referenceId: tx.id,
                    postedAt: new Date(),
                    transactionDate: new Date(),
                    isReversed: false
                }
            })

            fixedCount++
        }
    }

    console.log(`--- Sync Check Complete. Fixed ${fixedCount} mismatches. ---`)

    // ... (Keep existing check for isReversed=true but missing Contra) ...
    const reversedTxs = await prisma.loanTransaction.findMany({
        where: { isReversed: true },
    })
    console.log(`Checking ${reversedTxs.length} reversed transactions for missing Contra-Entries...`)

    let missingContraCount = 0
    for (const tx of reversedTxs) {
        const contraEntry = await prisma.loanTransaction.findFirst({
            where: { loanId: tx.loanId, type: 'REVERSAL', referenceId: tx.id }
        })

        if (!contraEntry) {
            console.log(`[FIXING] Missing Reversal for Tx ${tx.id}`)
            await prisma.loanTransaction.create({
                data: {
                    loanId: tx.loanId,
                    type: 'REVERSAL',
                    amount: tx.amount,
                    principalAmount: tx.principalAmount,
                    interestAmount: tx.interestAmount,
                    penaltyAmount: tx.penaltyAmount,
                    feeAmount: tx.feeAmount,
                    description: `Reversal: ${tx.type} (Repair)`,
                    referenceId: tx.id,
                    postedAt: new Date(),
                    transactionDate: new Date(),
                    isReversed: false
                }
            })
            missingContraCount++
        }
    }
    console.log(`Fixed ${missingContraCount} missing contra entries.`)
}

main()
