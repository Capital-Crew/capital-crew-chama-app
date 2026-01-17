
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Cleaning up test data...')
    // Delete Wallets first (FK dependency)
    const { count: wCount } = await prisma.wallet.deleteMany({
        where: { accountRef: { startsWith: 'WAL-TEST-' } }
    })
    console.log(`Deleted ${wCount} test wallets.`)

    // Delete Members
    const { count: mCount } = await prisma.member.deleteMany({
        where: { name: { startsWith: 'Test Member' } }
    })
    console.log(`Deleted ${mCount} test members.`)
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
