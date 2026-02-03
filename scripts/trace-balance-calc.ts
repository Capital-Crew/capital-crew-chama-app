import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function traceBalance() {
    console.log('🔍 Tracing Balance for LN017 (NO FILTER)...\n')

    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN017' }
    })

    if (!loan) return

    const loanId = loan.id
    console.log(`Loan ID: ${loanId}`)

    // 2. Fetch by Reference
    const refEntries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerTransaction: {
                referenceId: loanId,
                // isReversed: false // REMOVED
            },
            ledgerAccount: { type: 'ASSET' }
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    })
    console.log(`\nfound ${refEntries.length} by Reference ID`)
    refEntries.forEach(e => console.log(`[REF] ${e.amount} (${e.debitAmount} - ${e.creditAmount}) | ${e.description} | TX: ${e.ledgerTransaction.description} | Reversed: ${e.ledgerTransaction.isReversed}`))

    // 3. Fetch by Keyword
    const keywordEntries = await prisma.ledgerEntry.findMany({
        where: {
            // ledgerTransaction: { isReversed: false }, // REMOVED
            ledgerAccount: { type: 'ASSET' },
            description: { contains: loan.loanApplicationNumber }
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    })
    console.log(`\nfound ${keywordEntries.length} by Keyword`)
    keywordEntries.forEach(e => console.log(`[KEY] ${e.amount} (${e.debitAmount} - ${e.creditAmount}) | ${e.description} | TX: ${e.ledgerTransaction.description} | Reversed: ${e.ledgerTransaction.isReversed}`))

    // Merge
    const all = new Map()
    refEntries.forEach(e => all.set(e.id, e))
    keywordEntries.forEach(e => all.set(e.id, e))

    const lines = Array.from(all.values())

    let total = 0
    console.log('\n=== CALCULATION ===')
    for (const line of lines) {
        // If reversed, mark it
        const rev = line.ledgerTransaction.isReversed ? '(REV)' : ''
        const val = Number(line.debitAmount) - Number(line.creditAmount)
        total += val
        console.log(`+ ${val.toFixed(2)} ${rev} (${line.description})`)
    }

    console.log(`\nTOTAL: ${total.toFixed(2)}`)
}

traceBalance()
