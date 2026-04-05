
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function fixLN003() {
    const loanId = 'cmnf0fp7i0003tmxcnzlhukxx';
    console.log('Clearing ghost penalties for LN003...');

    await db.$transaction(async (tx) => {
        // 1. Clear schedule items
        await tx.repaymentInstallment.updateMany({
            where: { loanId },
            data: {
                penaltyDue: 0,
                penaltyPaid: 0,
                principalPaid: 0,
                interestPaid: 0,
                feesPaid: 0,
                isFullyPaid: false
            }
        });

        // 2. Clear loan header counters
        await tx.loan.update({
            where: { id: loanId },
            data: {
                penalties: 0,
                current_balance: 30000, // Matching Ledger 1310
                outstandingBalance: 32400 // Correct 30k + 2.4k interest
            }
        });
    });

    console.log('LN003 Operational State Cleaned.');

    // Import the replayed logic from the actual service for truth
    // Or just run a script that imports it.
}

fixLN003()
    .catch(console.error)
    .finally(() => db.$disconnect());
