import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const activeMembers = await prisma.member.count({
        where: { status: 'ACTIVE' }
    })

    const allMembers = await prisma.member.findMany({
        select: {
            id: true,
            name: true,
            memberNumber: true,
            status: true
        }
    })

    console.log(`Active Members Count: ${activeMembers}`)
    console.log('Sample Members:', allMembers.slice(0, 10))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
