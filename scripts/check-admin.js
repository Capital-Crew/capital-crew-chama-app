const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdmin() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@capitalcrew.com' },
        include: { member: true }
    })

    console.log('Admin User:', JSON.stringify(user, null, 2))

    await prisma.$disconnect()
}

checkAdmin()
