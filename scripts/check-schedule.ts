
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const insts = await db.repaymentInstallment.findMany({
        where: { loanId: 'cmnf0fp7i0003tmxcnzlhukxx' },
        orderBy: { installmentNumber: 'asc' }
    });
    console.log('Schedule for LN003:', JSON.stringify(insts, null, 2));
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
