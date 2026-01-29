
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findOrphanEntries(loanNumber: string) {
    console.log(`--- Searching all Ledger Entries for: ${loanNumber} ---`);

    // Search description for the loan number
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            description: { contains: loanNumber, mode: 'insensitive' }
        },
        include: {
            ledgerAccount: true,
            ledgerTransaction: true
        },
        orderBy: { ledgerTransaction: { transactionDate: 'asc' } }
    });

    for (const e of entries) {
        console.log(`ID: ${e.id.padEnd(25)} | Account: ${e.ledgerAccount.code} (${e.ledgerAccount.name.padEnd(20)}) | DR: ${e.debitAmount.toString().padStart(10)} | CR: ${e.creditAmount.toString().padStart(10)} | Ref: ${e.ledgerTransaction.referenceId} | Desc: ${e.description}`);
    }
}

findOrphanEntries('LN005')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
