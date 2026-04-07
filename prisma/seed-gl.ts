import { PrismaClient, AccountType } from '@prisma/client'

const prisma = new PrismaClient()

async function seedGLAccounts() {
    console.log('🌱 Seeding GL Accounts...')

    // Create the 5 consolidated GL accounts
    const accounts = [
        {
            code: '1100',
            name: 'Cash On Hand',
            type: AccountType.ASSET,
            description: 'Cash transactions and cash on hand'
        },
        {
            code: '1300',
            name: 'Receivables',
            type: AccountType.ASSET,
            description: 'Accrued interest and penalties receivable'
        },
        {
            code: '2200',
            name: 'Member Wallet',
            type: AccountType.LIABILITY,
            description: 'Member withdrawable balances'
        },
        {
            code: '1200',
            name: 'Contributions',
            type: AccountType.ASSET,
            description: 'Member contributions and disbursed loans'
        },
        {
            code: '4100',
            name: 'Revenue',
            type: AccountType.REVENUE,
            description: 'Interest revenue, fees, and penalties'
        }
    ]

    for (const account of accounts) {
        // @ts-ignore - Types might mismatch partly but data is compatible
        const existing = await prisma.ledgerAccount.findUnique({
            where: { code: account.code }
        })

        if (existing) {
            console.log(`✓ Account ${account.code} already exists`)
        } else {
            // @ts-ignore
            await prisma.ledgerAccount.create({
                data: account
            })
            console.log(`✓ Created account ${account.code} - ${account.name}`)
        }
    }

    console.log('✅ GL Accounts seeded successfully!')
}

seedGLAccounts()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error seeding GL accounts:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
