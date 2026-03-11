import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const acts = await prisma.ledgerAccount.findMany({ where: { code: { in: ['1200', '3011'] } } });
    acts.forEach(a => console.log(`Account ${a.code}: ${a.name} (Type: ${a.type}, Balance: ${Number(a.balance)})`));
    const maps = await prisma.systemAccountingMapping.findMany({ include: { account: true } });
    const contribMap = maps.find(m => m.type === 'CONTRIBUTIONS');
    const eventMap = maps.find(m => m.type === 'EVENT_SHARE_CONTRIBUTION');
    console.log(`\nMapping CONTRIBUTIONS -> ${contribMap?.account?.code} (${contribMap?.account?.name})`);
    console.log(`Mapping EVENT_SHARE_CONTRIBUTION -> ${eventMap?.account?.code} (${eventMap?.account?.name})`);
}
main().catch(console.error).finally(() => prisma.$disconnect())
