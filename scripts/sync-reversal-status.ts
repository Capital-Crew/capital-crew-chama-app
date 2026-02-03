import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncReversals() {
    console.log('🔄 Syncing Reversal Status (Ledger -> LoanTransaction)...\n')

    // Find all LoanTransactions that are NOT reversed, 
    // but their linked LedgerTransaction IS reversed.
    const desynced = await prisma.loanTransaction.findMany({
        where: {
            isReversed: false,
            // We need to check the ledger relations
            // Assuming referenceId in LedgerTransaction points to Loan Repayment ID?
            // Or usually LoanTransaction has a link to Ledger?
            // LoanTransaction has `referenceId` which IS the JournalEntry ID (LedgerTransaction.id)
            // Let's assume LoanTransaction.referenceId maps to LedgerTransaction.id
        },
        include: {
            // We can't easily filter by a relation property in 'where' if it's not indexed or mapped directly in this direction easily without explicit relation.
            // Let's fetch all and filter in memory or join.
            // LoanTransaction has 'referenceId' which is the JE ID.
        }
    })

    // Better query: Find LedgerTransactions that are reversed, and find matching LoanTransactions
    const reversedJournals = await prisma.ledgerTransaction.findMany({
        where: { isReversed: true },
        select: { id: true }
    })

    const reversedJournalIds = reversedJournals.map(j => j.id)

    console.log(`Found ${reversedJournalIds.length} reversed journals.`)

    const transactionsToFix = await prisma.loanTransaction.findMany({
        where: {
            referenceId: { in: reversedJournalIds },
            isReversed: false
        }
    })

    console.log(`Found ${transactionsToFix.length} loan transactions needing reversal sync.`)

    for (const tx of transactionsToFix) {
        console.log(`[FIX] marking LoanTx ${tx.id} (${tx.type}) as REVERSED`)
        await prisma.loanTransaction.update({
            where: { id: tx.id },
            data: { isReversed: true }
        })
    }

    console.log('\n✅ Reversal Sync Complete.')
}

syncReversals()
