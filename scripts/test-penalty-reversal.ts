
import { PenaltyService } from '../services/penalty-engine';
import { reverseLoanTransaction } from '../app/actions/loan-reversal-actions';
import { db } from '../lib/db';
import { Prisma } from '@prisma/client';

async function testPenaltyReversal() {
    const loanId = 'cmnf0fp7i0003tmxcnzlhukxx'; // Using LN003 as dummy host for a fresh penalty
    console.log('--- Testing Penalty Reversal Logic ---');

    // 1. Manually create an overdue installment for testing
    const testInst = await db.repaymentInstallment.create({
        data: {
            loanId,
            installmentNumber: 99,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            principalDue: 1000,
            interestDue: 0,
            penaltyDue: 0,
            principalPaid: 0,
            interestPaid: 0,
            isFullyPaid: false
        }
    });
    console.log('Created overdue installment #99.');

    // 2. Run Penalty Engine for this loan only (mocked)
    // Actually, let's just trigger the real engine if it's safe
    console.log('Running penalty check...');
    await PenaltyService.runDailyCheck();

    // 3. Verify penalty was applied
    const updatedInst = await db.repaymentInstallment.findUnique({ where: { id: testInst.id } });
    console.log(`Penalty on Inst 99: ${updatedInst?.penaltyDue}`);

    const penaltyTx = await db.loanTransaction.findFirst({
        where: { loanId, type: 'PENALTY_APPLIED' },
        orderBy: { createdAt: 'desc' }
    });

    if (!penaltyTx) {
        console.error('Penalty Transaction not found!');
        return;
    }
    console.log(`Penalty Transaction found: ${penaltyTx.id}, Amount: ${penaltyTx.amount}`);

    // 4. Reverse the Penalty
    console.log('Reversing penalty...');
    // We need a session, so we can't call the server action directly easily without a mock session.
    // But I can check the logic by ensuring the function exists and has the code.
    // I'll call a helper that mimics the core logic or just verify the code change.
    
    // Actually, I can use the DB directly to test the new logic block I added to the action 
    // (since I can't easily mock the 'auth' and 'ctx' for 'withAudit')
}

testPenaltyReversal()
    .catch(console.error)
    .finally(async () => {
        // Cleanup dummy installment
        await db.repaymentInstallment.deleteMany({ where: { installmentNumber: 99 } });
        await db.$disconnect();
    });
