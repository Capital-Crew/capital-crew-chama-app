
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const account = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } })
    if (!account) return

    console.log(`Account 1200 Cached Balance: ${account.balance}`)
    console.log(`Account Type: ${account.type}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
