
import { PrismaClient } from '@prisma/client';
import { LoanScheduleCache } from '../lib/services/LoanScheduleCache';
import { LoanBalanceService } from '../lib/services/LoanBalanceService';
const prisma = new PrismaClient();

async function deepSync() {
    console.log('--- STARTING DEEP LOAN SYNC ---');

    const loans = await prisma.loan.findMany({
        include: { repaymentInstallments: true }
    });

    for (const loan of loans) {
        console.log(`Syncing ${loan.loanApplicationNumber} (${loan.id})...`);

        // 1. Ensure installments exist
        if (loan.repaymentInstallments.length === 0) {
            console.log(`  Generating missing installments...`);
            try {
                await LoanScheduleCache.generateAndSaveSchedule(loan.id);
            } catch (e) {
                console.error(`  Failed to generate schedule:`, e);
            }
        }

        // 2. Calculate balance from installments (Contractual Truth)
        try {
            const balanceData = await LoanBalanceService.getLoanBalance(loan.id);
            const totalOutstanding = balanceData.totals.totalOutstanding;

            console.log(`  Calculated Balance: ${totalOutstanding}`);

            // 3. Update Loan Record
            await prisma.loan.update({
                where: { id: loan.id },
                data: {
                    outstandingBalance: totalOutstanding,
                    // Also sync legacy field if needed
                    current_balance: totalOutstanding
                }
            });
        } catch (e) {
            console.error(`  Failed to calculate balance:`, e);
        }
    }

    console.log('--- DEEP SYNC COMPLETE ---');
}

deepSync()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
