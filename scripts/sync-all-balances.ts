
import { PrismaClient } from '@prisma/client';
import { LoanBalanceService } from '../services/loan-balance';
const prisma = new PrismaClient();

async function syncAllBalances() {
    console.log('--- SYNCING LOAN BALANCES ---');
    const loans = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'CLEARED'] }
        }
    });

    console.log(`Found ${loans.length} loans to sync.`);

    for (const loan of loans) {
        try {
            const newBalance = await LoanBalanceService.updateLoanBalance(loan.id, prisma as any);
            console.log(`Synced ${loan.loanApplicationNumber}: ${newBalance}`);
        } catch (e) {
            console.error(`Failed to sync ${loan.loanApplicationNumber}:`, e);
        }
    }

    console.log('--- SYNC COMPLETE ---');
}

syncAllBalances()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
