
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const txs = await db.loanTransaction.findMany({
        where: { loanId: 'cmnf0fp7i0003tmxcnzlhukxx', isReversed: false },
        orderBy: { postedAt: 'asc' }
    });
    console.log('Un-reversed Transactions for LN003:', JSON.stringify(txs, null, 2));
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
