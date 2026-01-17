import prisma from '@/lib/prisma'

/**
 * Seed the Chart of Accounts for the SACCO
 * Standard accounts following regulatory requirements
 */
export async function seedChartOfAccounts() {
    console.log('🌱 Seeding Chart of Accounts...')

    const accounts = [
        // 1. CASH ON HAND (Asset)
        {
            code: '1100',
            name: 'Cash On Hand',
            type: 'ASSET' as const,
            subType: 'Current Asset',
            description: 'Organization liquidity pool'
        },

        // 2. RECEIVABLES (Asset)
        {
            code: '1300',
            name: 'Receivables',
            type: 'ASSET' as const,
            subType: 'Current Asset',
            description: 'Loans, Interest, and Penalties owed to the Org'
        },

        // 3. MEMBER WALLET (Liability)
        {
            code: '2200',
            name: 'Member Wallet',
            type: 'LIABILITY' as const,
            subType: 'Current Liability',
            description: 'Withdrawable member funds'
        },

        // 4. CONTRIBUTIONS (Asset/Liability - Standardized as 1200 Asset per Constants)
        // Note: Often mapped to 1200 in Default Constants.
        {
            code: '1200',
            name: 'Contributions',
            type: 'ASSET' as const,
            subType: 'Member Equity',
            description: 'Member deposits / Share Capital'
        },

        // 5. INCOME (Income)
        {
            code: '4100',
            name: 'Income',
            type: 'INCOME' as const,
            subType: 'Operating Income',
            description: 'All revenue: Interest, Processing Fees, Penalties'
        }
    ]

    for (const account of accounts) {
        await prisma.account.upsert({
            where: { code: account.code },
            update: account,
            create: account
        })
        console.log(`  ✓ ${account.code} - ${account.name}`)
    }

    console.log('✅ Chart of Accounts seeded successfully!')
}

// Run if called directly
if (require.main === module) {
    seedChartOfAccounts()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Error seeding Chart of Accounts:', error)
            process.exit(1)
        })
}
