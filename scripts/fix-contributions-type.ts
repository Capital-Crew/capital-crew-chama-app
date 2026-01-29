
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing Contributions Account Type...')

    // 1. Fetch current account
    const account = await prisma.ledgerAccount.findUnique({
        where: { code: '1200' }
    })

    if (!account) {
        console.error('Account 1200 not found!')
        return
    }

    console.log(`Current Type: ${account.type}`)

    if (account.type === 'ASSET') {
        console.log('Updating to EQUITY...')
        await prisma.ledgerAccount.update({
            where: { code: '1200' },
            data: {
                type: 'EQUITY',
                subType: 'Member Equity' // Ensure subtype is consistent
            }
        })
        console.log('✅ Updated Account 1200 to EQUITY.')
    } else {
        console.log('Account is already correct (not ASSET).')
    }

    // Verify
    const updated = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } })
    console.log('New Type:', updated?.type)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
