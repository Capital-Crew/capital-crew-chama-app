
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixDupes() {
    const tx = await prisma.ledgerTransaction.findFirst({
        where: { description: 'Legacy Interest Accrual Fix for LN005' }
    });

    if (tx) {
        console.log(`Deleting duplicate transaction ${tx.id}`);
        await prisma.ledgerTransaction.delete({ where: { id: tx.id } });
    } else {
        console.log('Duplicate transaction not found');
    }

    // Re-sync LN005
    const ln005 = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN005' } });
    if (ln005) {
        const { LoanBalanceService } = await import('../services/loan-balance');
        await LoanBalanceService.updateLoanBalance(ln005.id, prisma as any);
        console.log('LN005 Re-synced');
    }
}

fixDupes()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
