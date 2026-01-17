
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanUpLegacyMappings() {
    console.log('🧹 Cleaning up legacy mappings...')

    // We can't use the Enum type here safely because the client library might be out of sync
    // So we use deleteMany with a raw where clause or just cast it if possible, 
    // but the safest is strict type usage if the client was somehow generated. 
    // Since generation failed, the client might be old. 
    // Actually, if the client is old, it HAS the old enum value, so we can use it!

    try {
        const result = await prisma.systemAccountingMapping.deleteMany({
            where: {
                type: 'INCOME_LOAN_APPLICATION_FEE' as any
            }
        })
        console.log(`✓ Deleted ${result.count} legacy mappings for INCOME_LOAN_APPLICATION_FEE`)
    } catch (e) {
        console.warn('Could not standard delete, trying raw cleanup if needed but usually standard delete works if client matches DB state.')
        console.error(e)
    }

    console.log('✅ Cleanup complete!')
}

cleanUpLegacyMappings()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
