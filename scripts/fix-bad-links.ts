import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixBadLinks() {
    console.log('🔍 Scanning for Invalid LoanTransaction -> LedgerTransaction links...\n')

    // Fetch all Repayments with references
    const repayments = await prisma.loanTransaction.findMany({
        where: {
            type: { in: ['REPAYMENT', 'PAYMENT'] },
            referenceId: { not: null }
        }
    })

    let badLinks = 0
    let deletions = 0
    let updates = 0

    for (const tx of repayments) {
        if (!tx.referenceId) continue;

        const ledgerTx = await prisma.ledgerTransaction.findUnique({
            where: { id: tx.referenceId }
        })

        if (!ledgerTx) {
            console.log(`[ORPHAN LINK] TX ${tx.id} points to non-existent LedgerTx ${tx.referenceId}`)
            continue
        }

        // If Repayment points to DISBURSEMENT, it's definitely wrong.
        if (ledgerTx.referenceType === 'LOAN_DISBURSEMENT') {
            const description = tx.description || '';
            const isActuallyDisbursement = description.toLowerCase().includes('disbursement');

            console.log(`[MISMATCH DETECTED] TX ${tx.id} (${tx.type}) -> LedgerTx ${ledgerTx.id} (${ledgerTx.referenceType})`)

            if (isActuallyDisbursement) {
                console.log(`   -> Correcting LoanTransaction Type to DISBURSEMENT`)
                await prisma.loanTransaction.update({
                    where: { id: tx.id },
                    data: { type: 'DISBURSEMENT' }
                })
                updates++
            } else {
                // It's a Repayment pointing to a Disbursement. 
                // Likely a phantom repayment created by bad logic.
                // We should DELETE it to fix the math.
                console.log(`   -> DELETING Phantom Repayment LoanTransaction`)
                await prisma.loanTransaction.delete({
                    where: { id: tx.id }
                })
                deletions++
            }
            badLinks++
        }
    }

    console.log(`\n✅ Scan Complete.`)
    console.log(`   Found Bad Links: ${badLinks}`)
    console.log(`   Fixed (Type Update): ${updates}`)
    console.log(`   Fixed (Deleted): ${deletions}`)
}

fixBadLinks()
