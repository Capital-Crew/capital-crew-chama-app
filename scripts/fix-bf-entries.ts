import { PrismaClient, Prisma } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log('--- FIXING TRANSACTION ENTRIES FOR LOADED LOANS ---')

    // Find all ACTIVE/DISBURSED loans that still have the old "Initial disbursement" entry
    const loansWithOldEntry = await db.loanTransaction.findMany({
        where: {
            description: { contains: 'Initial disbursement for pre-approved loan' }
        },
        select: {
            id: true,
            loanId: true,
            amount: true,
            transactionDate: true,
            postedAt: true,
            loan: { select: { loanApplicationNumber: true } }
        }
    })

    if (loansWithOldEntry.length === 0) {
        console.log('✅ No old "Initial disbursement" entries found. Nothing to do.')
        return
    }

    console.log(`Found ${loansWithOldEntry.length} old entry(s) to replace:`)
    loansWithOldEntry.forEach(t => console.log(`  - Loan: ${t.loan.loanApplicationNumber} | Tx ID: ${t.id}`))

    for (const oldTx of loansWithOldEntry) {
        await db.$transaction(async (tx) => {
            // 1. Delete the old entry
            await tx.loanTransaction.delete({ where: { id: oldTx.id } })
            console.log(`  ✅ Deleted old "Initial disbursement" entry (ID: ${oldTx.id})`)

            // 2. Create the correct Balance B/F entry
            await tx.loanTransaction.create({
                data: {
                    loanId: oldTx.loanId,
                    type: 'DISBURSEMENT',
                    amount: oldTx.amount,
                    principalAmount: oldTx.amount,
                    description: `Balance B/F — Migrated existing loan`,
                    transactionDate: oldTx.transactionDate,
                    postedAt: oldTx.postedAt ?? new Date(),
                }
            })
            console.log(`  ✅ Balance B/F entry created for loan ${oldTx.loan.loanApplicationNumber}`)
        })
    }

    console.log('\n--- FIX COMPLETED SUCCESSFULLY ---')
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
