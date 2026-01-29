
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function bulkMigrate() {
    console.log('--- BULK MIGRATION: 1200 -> 1310 ---');

    const targetAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } });
    const sourceAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } });

    if (!targetAcc || !sourceAcc) {
        console.error('Missing accounts');
        return;
    }

    // Find entries in 1200 that mention "Loan" or "LN"
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerAccountId: sourceAcc.id,
            OR: [
                { description: { contains: 'Loan', mode: 'insensitive' } },
                { description: { contains: 'LN', mode: 'insensitive' } },
                { ledgerTransaction: { description: { contains: 'Loan', mode: 'insensitive' } } },
                { ledgerTransaction: { description: { contains: 'LN', mode: 'insensitive' } } }
            ]
        }
    });

    console.log(`Found ${entries.length} entries to migrate.`);

    for (const e of entries) {
        console.log(`  Migrating entry ${e.id}: ${e.description || 'No desc'}`);
        await prisma.ledgerEntry.update({
            where: { id: e.id },
            data: { ledgerAccountId: targetAcc.id }
        });
    }

    // Now Sync all loans
    console.log('Syncing all loan balances...');
    const loans = await prisma.loan.findMany();
    const { getLoanOutstandingBalance } = await import('../lib/accounting/AccountingEngine');

    for (const loan of loans) {
        const bal = await getLoanOutstandingBalance(loan.id);
        await prisma.loan.update({
            where: { id: loan.id },
            data: { outstandingBalance: bal }
        });
        console.log(`  ${loan.loanApplicationNumber}: ${bal}`);
    }

    console.log('--- BULK MIGRATION COMPLETE ---');
}

bulkMigrate()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
