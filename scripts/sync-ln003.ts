
import { PrismaClient } from '@prisma/client';
import { LoanBalanceService } from '../services/loan-balance';

const db = new PrismaClient();

async function syncLoan() {
    const loanNumber = 'LN003';
    const originalWaiverTxId = 'cmnkd7l0w0004la04e0wiixq5';
    const journalReversalId = 'cmnkinppe0000js046v32yyd1';

    console.log(`Syncing ${loanNumber}...`);

    await db.$transaction(async (tx) => {
        // 1. Mark the LoanTransaction as reversed
        await tx.loanTransaction.update({
            where: { id: originalWaiverTxId },
            data: {
                isReversed: true,
                reversedAt: new Date()
            }
        });

        // 2. Create the REVERSAL LoanTransaction for operational consistency
        // (The reversal action usually does this)
        await tx.loanTransaction.create({
            data: {
                loanId: 'cmnf0fp7i0003tmxcnzlhukxx',
                type: 'REVERSAL',
                amount: 8100,
                description: `Manual Reversal of Waiver (Ref: ${journalReversalId})`,
                referenceId: originalWaiverTxId,
                postedAt: new Date(),
                isReversed: false
            }
        });

        // 3. Increment installment paid amounts back (since it was a waiver reduction)
        // Wait, a waiver REDUCED the principalPaid. To reverse it, we must subtract the paid amount.
        // Actually, WaterfallAllocation.allocate on a waiver INCREASES principalPaid.
        // So reversing it means REDUCING principalPaid back to 0.
        
        console.log('Restoring installments...');
        await tx.repaymentInstallment.updateMany({
            where: { 
                loanId: 'cmnf0fp7i0003tmxcnzlhukxx'
                // We'll reset all to 0 paid since there are no other successful repayments for LN003 yet
            },
            data: {
                penaltyPaid: 0,
                interestPaid: 0,
                principalPaid: 0,
                isFullyPaid: false
            }
        });

        // 4. Update Header Balance from Ledger (Should still be -30000 but good to run)
        await LoanBalanceService.updateLoanBalance('cmnf0fp7i0003tmxcnzlhukxx', tx);
    });

    console.log('Sync complete.');
}

syncLoan()
    .catch(console.error)
    .finally(() => db.$disconnect());
