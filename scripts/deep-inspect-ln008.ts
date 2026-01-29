
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deepInspect() {
    const ln008 = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN008' } });
    if (!ln008) return;

    console.log('--- LN008 Raw Data ---');
    console.log(JSON.stringify(ln008, null, 2));

    console.log('\n--- Account Types Check ---');
    const accs = await prisma.ledgerAccount.findMany({
        where: { code: { startsWith: '4' } }
    });
    console.log(JSON.stringify(accs, null, 2));

    console.log('\n--- All Ledger Entries for LN008 (Description matches) ---');
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            OR: [
                { description: { contains: 'LN008' } },
                { ledgerTransaction: { description: { contains: 'LN008' } } }
            ]
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    });
    for (const e of entries) {
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}] ${e.ledgerAccount.code} (${e.ledgerAccount.type}) | DR: ${e.debitAmount} | CR: ${e.creditAmount} | Desc: ${e.description || e.ledgerTransaction.description}`);
    }
}

deepInspect()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
