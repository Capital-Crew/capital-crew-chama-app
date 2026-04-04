
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const q = '6v32yyd1';
    console.log(`Searching for '${q}'...`);

    const loanTxs = await db.loanTransaction.findMany({
        where: {
            OR: [
                { id: { contains: q } },
                { referenceId: { contains: q } },
                { description: { contains: q } }
            ]
        },
        include: { loan: true }
    });
    console.log('LoanTransactions found:', loanTxs.length);
    loanTxs.forEach(tx => console.log(`- ID: ${tx.id}, Type: ${tx.type}, Amount: ${tx.amount}, Loan: ${tx.loan.loanApplicationNumber}, IsReversed: ${tx.isReversed}, Ref: ${tx.referenceId}`));

    const ledgerTxs = await db.ledgerTransaction.findMany({
        where: {
            OR: [
                { id: { contains: q } },
                { referenceId: { contains: q } },
                { description: { contains: q } }
            ]
        }
    });
    console.log('LedgerTransactions found:', ledgerTxs.length);
    ledgerTxs.forEach(tx => console.log(`- ID: ${tx.id}, Ref: ${tx.referenceId}, Desc: ${tx.description}`));
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
