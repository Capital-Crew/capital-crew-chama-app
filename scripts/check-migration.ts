
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function checkMigrationEntry() {
    const txId = 'cmnf0fra5000atmxc2u66kv38'; // Balance B/F — Loan LN003
    console.log(`Checking transaction ${txId}...`);

    const entries = await db.ledgerEntry.findMany({
        where: { ledgerTransactionId: txId },
        include: { ledgerAccount: true }
    });

    entries.forEach(e => {
        console.log(`Acc: ${e.ledgerAccount.code} (${e.ledgerAccount.name}) [${e.ledgerAccount.type}] - DR: ${e.debitAmount}, CR: ${e.creditAmount}, Desc: ${e.description}`);
    });
}

checkMigrationEntry()
    .catch(console.error)
    .finally(() => db.$disconnect());
