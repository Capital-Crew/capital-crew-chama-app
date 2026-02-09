import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const members = await prisma.member.findMany({
        select: {
            status: true
        }
    })

    const statusCounts = members.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    console.log('Member Status Distribution:', statusCounts)
    console.log('Total Members:', members.length)

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            memberId: true
        }
    })
    console.log('Total Users:', users.length)
    console.log('Users with memberId:', users.filter(u => u.memberId).length)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
