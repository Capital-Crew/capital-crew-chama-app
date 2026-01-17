import prisma from '@/lib/prisma'
import { SystemAccountType } from '@prisma/client'

/**
 * Seed System Ledger Mappings
 * Connects System Events to GL Accounts
 */
export async function seedLedgerMappings() {
    console.log('🔗 Seeding Ledger Mappings...')

    const mappings = [
        { type: 'CASH_ON_HAND', accountCode: '1100' },
        { type: 'RECEIVABLES', accountCode: '1300' },
        { type: 'MEMBER_WALLET', accountCode: '2200' },
        { type: 'CONTRIBUTIONS', accountCode: '1200' },
        { type: 'INCOME', accountCode: '4100' }
    ]

    for (const map of mappings) {
        const account = await prisma.account.findUnique({
            where: { code: map.accountCode }
        })

        if (!account) {
            console.error(`⚠️ Account ${map.accountCode} not found! Skipping mapping for ${map.type}`)
            continue
        }

        // Upsert mapping
        await prisma.systemAccountingMapping.upsert({
            where: { type: map.type as SystemAccountType },
            update: { accountId: account.id },
            create: {
                type: map.type as SystemAccountType,
                accountId: account.id
            }
        })
        console.log(`  ✓ Mapped ${map.type} -> ${account.name} (${account.code})`)
    }

    console.log('✅ Ledger Mappings seeded successfully!')
}

// Run if called directly
if (require.main === module) {
    seedLedgerMappings()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Error seeding mappings:', error)
            process.exit(1)
        })
}
