
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const activeAccounts = await prisma.ledgerAccount.findMany({
        where: { isActive: true },
        select: { code: true, name: true }
    })

    console.log('Active Accounts:', activeAccounts)
    if (activeAccounts.length === 5) {
        console.log('✅ Verification Passed: Exactly 5 active accounts.')
    } else {
        console.log(`❌ Verification Failed: Found ${activeAccounts.length} active accounts.`)
    }
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
