
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Fixing 'RECIEVABLES' account...")

        // Find by code 1200 (Core Receivables) is best, or by code if flexible.
        // The debug output showed code '1200' associated with 'RECIEVABLES'

        const acc = await prisma.ledgerAccount.update({
            where: { code: '1200' },
            data: {
                name: 'RECEIVABLES', // Fix typo
                type: 'ASSET'        // Fix type (was LIABILITY)
            }
        })

        console.log("✅ Updated Account 1200:", acc)

    } catch (e) {
        console.error("❌ Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
