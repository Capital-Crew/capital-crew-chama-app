import { PrismaClient, Prisma } from '@prisma/client'
import { getLoanOutstandingBalance } from '../lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

async function syncBalances() {
    console.log('🔄 Syncing Ledger Balances to Stored Field...\n')

    const loans = await prisma.loan.findMany({
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } }
    })

    console.log(`Found ${loans.length} active/overdue loans`)

    let updated = 0
    let skipped = 0

    for (const loan of loans) {
        try {
            const ledgerBalance = await getLoanOutstandingBalance(loan.id)
            const storedBalance = Number(loan.outstandingBalance)

            // Allow small float diff (money type)
            if (Math.abs(ledgerBalance - storedBalance) > 0.005) {
                console.log(`[UPDATE] ${loan.loanApplicationNumber}: Stored ${storedBalance.toFixed(2)} -> Ledger ${ledgerBalance.toFixed(2)}`)

                await prisma.loan.update({
                    where: { id: loan.id },
                    data: {
                        outstandingBalance: new Prisma.Decimal(ledgerBalance),
                        // Also update current_balance as it's legacy
                        current_balance: new Prisma.Decimal(ledgerBalance)
                    }
                })
                updated++
            } else {
                skipped++
                // console.log(`[SKIP] ${loan.loanApplicationNumber} is in sync`)
            }

        } catch (e) {
            console.error(`[ERROR] Failed to sync ${loan.loanApplicationNumber}:`, e)
        }
    }

    console.log(`\n✅ Sync Complete. Updated: ${updated}, Skipped: ${skipped}`)
}

syncBalances()
