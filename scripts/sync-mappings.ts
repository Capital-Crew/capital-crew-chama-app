import { PrismaClient, SystemAccountType } from '@prisma/client'
import { DEFAULT_MAPPINGS } from '../lib/accounting/constants'

const prisma = new PrismaClient()

async function main() {
    console.log('Syncing System Account Mappings...')

    // Seed Core Accounts if Missing
    const coreAccounts = [
        { code: '1000', name: 'Cash / Bank', type: 'ASSET' },
        { code: '1200', name: 'Loan Portfolio', type: 'ASSET' },
        { code: '2000', name: 'Member Deposits', type: 'LIABILITY' },
        { code: '3000', name: 'Member Contributions', type: 'EQUITY' },
        { code: '4000', name: 'General Income', type: 'REVENUE' },
        { code: '6000', name: 'General Expense', type: 'EXPENSE' }
    ]

    for (const acc of coreAccounts) {
        await prisma.ledgerAccount.upsert({
            where: { code: acc.code },
            update: {},
            create: {
                code: acc.code,
                name: acc.name,
                type: acc.type as any,
                isActive: true,
                allowManualEntry: true
            }
        })
        console.log(`Ensured Account ${acc.code} exists.`)
    }

    for (const [type, code] of Object.entries(DEFAULT_MAPPINGS)) {
        // Find the ledger account for this code
        const account = await prisma.ledgerAccount.findUnique({ where: { code } })

        if (!account) {
            console.error(`Error: Ledger Account ${code} still not found for type ${type}. Unexpected.`)
            continue
        }

        // Upsert Mapping
        const existing = await prisma.systemAccountingMapping.findUnique({
            where: { type: type as SystemAccountType }
        })

        if (!existing) {
            console.log(`Creating missing mapping: ${type} -> ${code}`)
            await prisma.systemAccountingMapping.create({
                data: {
                    type: type as SystemAccountType,
                    accountId: account.id
                }
            })
        }
    }
    console.log('Sync complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
