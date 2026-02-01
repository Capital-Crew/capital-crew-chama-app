import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const members = await prisma.member.findMany({
        include: { wallet: true }
    })
    console.log(JSON.stringify(members.map(m => ({ id: m.id, name: m.name, status: m.status, walletId: m.wallet?.id })), null, 2))
}
main().finally(() => prisma.$disconnect())
