
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    console.log('Searching for loan LN003...');
    const loan = await db.loan.findFirst({
        where: { loanApplicationNumber: 'LN003' }
    });

    if (!loan) {
        console.log('Loan LN003 not found.');
        return;
    }

    console.log(`Loan ID: ${loan.id}`);
    console.log(`Current Balance: ${loan.outstandingBalance}`);

    const txs = await db.loanTransaction.findMany({
        where: { loanId: loan.id },
        orderBy: { postedAt: 'desc' }
    });

    console.log('\n--- Loan Transactions ---');
    txs.forEach(tx => {
        console.log(`[${tx.postedAt.toISOString()}] ID: ${tx.id}, Type: ${tx.type}, Amount: ${tx.amount}, Ref: ${tx.referenceId}, Reversed: ${tx.isReversed}`);
        if (tx.description) console.log(`  Desc: ${tx.description}`);
    });

    const ledgerTxs = await db.ledgerTransaction.findMany({
        where: { referenceId: loan.id },
        orderBy: { transactionDate: 'desc' }
    });

    console.log('\n--- Ledger Transactions (Ref: Loan ID) ---');
    ledgerTxs.forEach(tx => {
        console.log(`[${tx.transactionDate.toISOString()}] ID: ${tx.id}, Ref: ${tx.referenceId}, Desc: ${tx.description}`);
    });
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
