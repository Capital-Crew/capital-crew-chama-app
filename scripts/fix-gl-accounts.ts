
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixGLAccounts() {
    console.log('🔧 Fixing GL Account Definitions...')

    const accounts = [
        {
            code: '1100',
            name: 'Cash On Hand',
            type: 'ASSET',
            description: 'Cash transactions and cash on hand'
        },
        {
            code: '1300',
            name: 'Receivables',
            type: 'ASSET',
            description: 'Accrued interest and penalties receivable'
        },
        {
            code: '2200',
            name: 'Member Wallet',
            type: 'LIABILITY',
            description: 'Member withdrawable balances'
        },
        {
            code: '1200',
            name: 'Contributions',
            type: 'ASSET',
            description: 'Member contributions and disbursed loans'
        },
        {
            code: '4100',
            name: 'Income',
            type: 'INCOME',
            description: 'Interest income, fees, and penalties'
        }
    ]

    for (const account of accounts) {
        console.log(`Processing ${account.code}...`)

        // Upsert to ensure it exists and has correct details
        const result = await prisma.account.upsert({
            where: { code: account.code },
            update: {
                name: account.name,
                description: account.description,
                type: account.type as any
            },
            create: {
                code: account.code,
                name: account.name,
                description: account.description,
                type: account.type as any
            }
        })
        console.log(`✓ Updated ${result.code}: ${result.name}`)
    }

    // Verify
    console.log('\n🔍 Verification Table:')
    const verified = await prisma.account.findMany({
        where: { code: { in: accounts.map(a => a.code) } },
        orderBy: { code: 'asc' },
        select: { code: true, name: true }
    })
    console.table(verified)

    console.log('✅ GL Accounts fixed successfully!')
}

fixGLAccounts()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error fixing GL accounts:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
