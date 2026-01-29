
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function globalSearch(keyword: string) {
    console.log(`--- GLOBAL SEARCH: "${keyword}" ---`);
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            OR: [
                { description: { contains: keyword } },
                { ledgerTransaction: { description: { contains: keyword } } }
            ]
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    });

    for (const e of entries) {
        console.log(`ID: ${e.id} | Acc: ${e.ledgerAccount.code} (${e.ledgerAccount.type}) | DR: ${e.debitAmount} | CR: ${e.creditAmount} | RefID: ${e.ledgerTransaction.referenceId} | Desc: ${e.description || e.ledgerTransaction.description}`);
    }
}

globalSearch(process.argv[2] || 'LN008')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
