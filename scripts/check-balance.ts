
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const loan = await db.loan.findFirst({
        where: { loanApplicationNumber: 'LN003' }
    });
    console.log('Loan LN003:', { 
        outstandingBalance: loan?.outstandingBalance, 
        current_balance: loan?.current_balance 
    });
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
