
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAccounts() {
    const accs = await prisma.ledgerAccount.findMany({
        where: { code: { in: ['1200', '1310', '1320'] } }
    });
    console.log(JSON.stringify(accs, null, 2));
}

checkAccounts()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
