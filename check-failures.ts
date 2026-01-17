
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Latest Transactions ---')
    const transactions = await prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { member: true }
    })

    console.log(`Found ${transactions.length} transactions.`)
    console.table(transactions.map(t => ({
        id: t.id.substring(t.id.length - 8), // Short ID
        status: t.status,
        amount: t.amount,
        phone: t.phoneNumber,
        reason: t.failureReason || 'NULL',
        checkoutRequestId: t.checkoutRequestId,
        time: t.createdAt.toISOString()
    })))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
