import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const mappings = await prisma.systemAccountingMapping.findMany({ include: { account: true } });
    mappings.forEach(m => console.log(m.type, '->', m.account?.code));
}
main().catch(console.error).finally(() => prisma.$disconnect())
