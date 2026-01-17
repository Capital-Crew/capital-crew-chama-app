
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Checking Users and Roles...")
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        })

        console.table(users)

    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
