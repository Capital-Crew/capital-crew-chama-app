
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function forceClean() {
    console.log('🧹 Force cleaning legacy mappings with RAW SQL...')

    try {
        // Use executeRaw to bypass Prisma validation
        const count = await prisma.$executeRaw`
            DELETE FROM "SystemAccountingMapping" 
            WHERE "type"::text = 'INCOME_LOAN_APPLICATION_FEE';
        `
        console.log(`✓ Deleted ${count} entries.`)
    } catch (e) {
        console.error('❌ Error executing raw SQL:', e)
    }

    console.log('✅ Force clean complete!')
}

forceClean()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
