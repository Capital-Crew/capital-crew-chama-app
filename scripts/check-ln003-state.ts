
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const loan = await db.loan.findUnique({
        where: { id: 'cmnf0fp7i0003tmxcnzlhukxx' }
    });
    console.log('Loan LN003:', JSON.stringify(loan, null, 2));
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
