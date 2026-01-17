
import { PrismaClient } from '@prisma/client'
import { AccountingEngine } from '../lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Liquidity Pool (Account 1200)...')

    // 1. Ensure Account 1200 exists
    let pool = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } })
    if (!pool) {
        console.log('Creating Account 1200...')
        pool = await prisma.ledgerAccount.create({
            data: {
                code: '1200',
                name: 'Loan Fund / Liquidity Pool',
                type: 'ASSET',
                isActive: true,
                allowManualEntry: true
            }
        })
    }

    // 2. Ensure Equity Account 3000 exists (Source of funds)
    let equity = await prisma.ledgerAccount.findUnique({ where: { code: '3000' } })
    if (!equity) {
        console.log('Creating Account 3000...')
        equity = await prisma.ledgerAccount.create({
            data: {
                code: '3000',
                name: 'Sacco Capital / Equity',
                type: 'EQUITY',
                isActive: true,
                allowManualEntry: true
            }
        })
    }

    // 3. Post Capital Injection
    const amount = 5000000 // 5 Million

    console.log(`Injecting KES ${amount.toLocaleString()} into ${pool.name}...`)

    const je = await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: 'MANUAL_ADJUSTMENT',
        referenceId: 'SEED-LIQUIDITY',
        description: 'Initial Capital Injection for Lending',
        createdBy: 'SYSTEM',
        createdByName: 'System Script',
        lines: [
            {
                accountCode: '1200',
                debitAmount: amount, // Asset increases with Debit
                creditAmount: 0,
                description: 'Capital Injection'
            },
            {
                accountCode: '3000',
                debitAmount: 0,
                creditAmount: amount, // Equity increases with Credit
                description: 'Capital Source'
            }
        ]
    })

    console.log('Success! Journal Entry created:', je.id)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
