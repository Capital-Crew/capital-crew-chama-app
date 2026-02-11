
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Use raw query because the client types might be out of sync
    const result = await prisma.$queryRaw`
    SELECT count(*) as count, status FROM "Expense" GROUP BY status
  `
    console.log('Current Expense Statuses:', result)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
