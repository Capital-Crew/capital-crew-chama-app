import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const pendingRequests = await prisma.workflowRequest.count({
        where: { status: 'PENDING' }
    })

    const pendingByType = await prisma.workflowRequest.groupBy({
        by: ['entityType'],
        where: { status: 'PENDING' },
        _count: { _all: true }
    })

    console.log(`Total Pending Requests: ${pendingRequests}`)
    console.log('Pending by Entity Type:')
    console.table(pendingByType.map(item => ({
        EntityType: item.entityType,
        Count: item._count._all
    })))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
