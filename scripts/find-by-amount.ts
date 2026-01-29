
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findByAmount(amount: number) {
    console.log(`--- Searching Ledger Entries for Amount: ${amount} ---`);
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            OR: [
                { debitAmount: amount },
                { creditAmount: amount }
            ]
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    });

    for (const e of entries) {
        console.log(`ID: ${e.id} | Account: ${e.ledgerAccount.code} | DR: ${e.debitAmount} | CR: ${e.creditAmount} | Desc: ${e.description} | Ref: ${e.ledgerTransaction.referenceId}`);
    }
}

findByAmount(19.35)
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
