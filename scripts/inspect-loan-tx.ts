
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectLoanTransactions(loanNumber: string) {
    console.log(`--- LoanTransaction Sub-Ledger: ${loanNumber} ---`);
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanNumber }
    });
    if (!loan) return;

    const txs = await prisma.loanTransaction.findMany({
        where: { loanId: loan.id },
        orderBy: { postedAt: 'asc' }
    });

    for (const tx of txs) {
        console.log(`[${tx.postedAt.toISOString().split('T')[0]}] ${tx.type.padEnd(15)} | Amount: ${tx.amount.toString().padStart(10)} | Desc: ${tx.description}`);
    }
}

inspectLoanTransactions('LN005')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
