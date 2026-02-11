
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Backfilling requestedAmount...')

    // Update all expenses where requestedAmount is 0 (default) to match amount
    const count = await prisma.$executeRawUnsafe(
        `UPDATE "Expense" SET "requestedAmount" = "amount" WHERE "requestedAmount" = 0`
    )

    console.log(`✅ Updated ${count} expenses.`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
