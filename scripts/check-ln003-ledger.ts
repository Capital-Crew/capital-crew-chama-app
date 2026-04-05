
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const entries = await db.ledgerEntry.findMany({
        where: { ledgerAccount: { code: '1310' } },
        include: { ledgerAccount: true }
    });
    const ln003Balance = entries
        .filter((e: any) => e.description.includes('LN003'))
        .reduce((sum: any, e: any) => sum + Number(e.debitAmount) - Number(e.creditAmount), 0);
    console.log('Ledger Balance for LN003 (1310):', ln003Balance);
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
