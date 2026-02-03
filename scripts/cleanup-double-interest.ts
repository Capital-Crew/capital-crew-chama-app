import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
    console.log('🧹 Cleaning up double interest backfills...\n')

    // Find backfilled ledger transactions
    const backfills = await prisma.ledgerTransaction.findMany({
        where: {
            description: { contains: '[BACKFILL] Interest accrual link repair' },
            createdByName: 'Link Repair Script'
        },
        include: { lines: true }
    })

    console.log(`Found ${backfills.length} backfills`)

    for (const bf of backfills) {
        const loanId = bf.referenceId
        const amount = bf.totalAmount // or check lines

        console.log(`Checking Loan ${loanId}...`)

        // Find ORIGINAL accrual (not backfill)
        const original = await prisma.ledgerTransaction.findFirst({
            where: {
                referenceId: loanId,
                id: { not: bf.id },
                description: { contains: 'Interest Accrual' }, // Heuristic
                // type matching?
            }
        })

        if (original) {
            console.log(`  Found Original Ledger TX: ${original.id} (${original.description})`)
            console.log(`  Backfill ID: ${bf.id}`)

            // 1. Relink LoanTransaction
            const loanTx = await prisma.loanTransaction.findFirst({
                where: { referenceId: bf.id }
            })

            if (loanTx) {
                console.log(`  Relinking LoanTX ${loanTx.id} to Original...`)
                await prisma.loanTransaction.update({
                    where: { id: loanTx.id },
                    data: { referenceId: original.id }
                })
            }

            // 2. Delete Backfill Ledger Lines & TX
            console.log(`  Deleting Backfill Ledger Entry...`)
            await prisma.ledgerEntry.deleteMany({
                where: { transactionId: bf.id }
            })
            await prisma.ledgerTransaction.delete({
                where: { id: bf.id }
            })
            console.log('  ✅ Cleaned up')
        } else {
            console.log('  ⚠️ No original found. Backfill might be legitimate.')
        }
    }
}

cleanup()
