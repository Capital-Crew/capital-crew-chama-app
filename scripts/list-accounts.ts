
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listAccounts() {
    const accounts = await prisma.ledgerAccount.findMany({
        orderBy: { code: 'asc' }
    });
    console.log('Code | Name'.padEnd(40) + ' | Type'.padEnd(10) + ' | Balance');
    console.log('-'.repeat(60));
    for (const acc of accounts) {
        console.log(`${acc.code.padEnd(4)} | ${acc.name.padEnd(31)} | ${acc.type.padEnd(10)} | ${acc.balance}`);
    }
}

listAccounts()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
