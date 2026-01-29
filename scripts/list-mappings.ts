
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listMappings() {
    const mappings = await prisma.systemAccountingMapping.findMany({
        include: { account: true }
    });
    console.log('Type'.padEnd(30) + ' | Code | Account Name');
    console.log('-'.repeat(60));
    for (const m of mappings) {
        console.log(`${m.type.padEnd(30)} | ${m.account.code.padEnd(4)} | ${m.account.name}`);
    }
}

listMappings()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
