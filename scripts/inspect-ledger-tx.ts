
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectTx(txId: string) {
    console.log(`--- LedgerTransaction: ${txId} ---`);
    const tx = await prisma.ledgerTransaction.findUnique({
        where: { id: txId },
        include: {
            ledgerEntries: {
                include: { ledgerAccount: true }
            }
        }
    });

    if (!tx) {
        console.log('Transaction not found');
        return;
    }

    console.log(`Date: ${tx.transactionDate}`);
    console.log(`Type: ${tx.referenceType}`);
    console.log(`RefID: ${tx.referenceId}`);
    console.log(`Description: ${tx.description}`);

    for (const e of tx.ledgerEntries) {
        console.log(`  Account: ${e.ledgerAccount.code} (${e.ledgerAccount.name}) | DR: ${e.debitAmount} | CR: ${e.creditAmount} | Desc: ${e.description}`);
    }
}

inspectTx('cmkyfzvo90030tm5kf559ghr1')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
