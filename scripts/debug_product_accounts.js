
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugAccounts() {
    try {
        console.log("Fetching all accounts...")
        const accounts = await prisma.ledgerAccount.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                type: true
            },
            orderBy: { code: 'asc' }
        });

        console.log(`Found ${accounts.length} accounts:`)
        accounts.forEach(acc => {
            console.log(`[${acc.code}] ${acc.name} (${acc.type})`)
        })

    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

debugAccounts()
