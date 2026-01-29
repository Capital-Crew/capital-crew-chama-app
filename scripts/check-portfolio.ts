
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPortfolio() {
    const acc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } });
    if (!acc) return;

    const entries = await prisma.ledgerEntry.findMany({
        where: { ledgerAccountId: acc.id },
        include: { ledgerTransaction: true },
        orderBy: { ledgerTransaction: { transactionDate: 'asc' } }
    });

    console.log(`--- Ledger Account 1310 (Portfolio) Entries ---`);
    let balance = 0;
    for (const e of entries) {
        const dr = Number(e.debitAmount);
        const cr = Number(e.creditAmount);
        balance += (dr - cr);
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}] DR: ${dr.toString().padStart(10)} | CR: ${cr.toString().padStart(10)} | Bal: ${balance.toString().padStart(10)} | Desc: ${e.description}`);
    }
}

checkPortfolio()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
