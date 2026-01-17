
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Attempting to delete unused ledgers...')

    // The Allowed 5
    const allowedCodes = ['1000', '1200', '2000', '3000', '4000']

    // Find candidates (all except allowed)
    const candidates = await prisma.ledgerAccount.findMany({
        where: {
            code: { notIn: allowedCodes }
        },
        select: { id: true, code: true, name: true }
    })

    console.log(`Found ${candidates.length} candidates for deletion.`)

    let deletedCount = 0
    let skippedCount = 0

    for (const acc of candidates) {
        try {
            // Attempt delete
            await prisma.ledgerAccount.delete({
                where: { id: acc.id }
            })
            console.log(`✅ Deleted ${acc.name} (${acc.code})`)
            deletedCount++
        } catch (error: any) {
            // Failed likely due to foreign key constraints (existing transactions, mappings, etc)
            console.log(`⚠️  Skipped ${acc.name} (${acc.code}) - Used in transactions or settings.`)
            skippedCount++
        }
    }

    console.log('\nSummary:')
    console.log(`Deleted: ${deletedCount}`)
    console.log(`Kept (Archived): ${skippedCount}`)
    console.log('Core 5 Accounts are untouched.')
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
