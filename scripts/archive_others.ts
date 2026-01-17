
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Archiving non-core ledgers...')

    // The Allowed 5
    const allowedCodes = ['1000', '1200', '2000', '3000', '4000']

    // 1. Deactivate all others
    const result = await prisma.ledgerAccount.updateMany({
        where: {
            code: { notIn: allowedCodes }
        },
        data: {
            isActive: false
        }
    })

    console.log(`Deactivated ${result.count} accounts.`)

    // 2. Ensure the 5 are Active
    await prisma.ledgerAccount.updateMany({
        where: {
            code: { in: allowedCodes }
        },
        data: {
            isActive: true
        }
    })

    console.log('Core 5 accounts are active.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
