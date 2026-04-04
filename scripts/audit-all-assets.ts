
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function listAllAssetEntries() {
    const loanNumber = 'LN003';
    console.log(`Auditing all ASSET entries for ${loanNumber}...`);

    const entries = await db.ledgerEntry.findMany({
        where: {
            ledgerAccount: { type: 'ASSET' },
            OR: [
                { description: { contains: loanNumber } },
                { ledgerTransaction: { description: { contains: loanNumber } } }
            ]
        },
        include: {
            ledgerAccount: true,
            ledgerTransaction: true
        }
    });

    console.log(`\nFound ${entries.length} entries.`);
    let sum = 0;
    entries.forEach(e => {
        const val = Number(e.debitAmount) - Number(e.creditAmount);
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString()}] ID: ${e.ledgerTransaction.id} - Acc: ${e.ledgerAccount.code} - DR: ${e.debitAmount}, CR: ${e.creditAmount}, Net: ${val}, Desc: ${e.description}`);
        sum += val;
    });

    console.log(`\nTotal Calculated Asset Balance: ${sum}`);
}

listAllAssetEntries()
    .catch(console.error)
    .finally(() => db.$disconnect());
