
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deepRepair() {
    console.log('--- STARTING DEEP REPAIR ---');

    const ln005 = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN005' } });
    if (!ln005) return;

    // 1. Fix Ledger Transactions
    // Find transactions with "Offset" or "Refinance" for LN005 that have the wrong referenceId
    const txs = await prisma.ledgerTransaction.findMany({
        where: {
            description: { contains: 'LN005' },
            referenceId: { not: ln005.id }
        }
    });

    console.log(`Found ${txs.length} ledger transactions to relink to LN005.`);
    for (const tx of txs) {
        if (tx.description.includes('Offset') || tx.description.includes('Refinance')) {
            await prisma.ledgerTransaction.update({
                where: { id: tx.id },
                data: { referenceId: ln005.id }
            });
            console.log(`  Relinked Tx ${tx.id} (${tx.description}) to ${ln005.loanApplicationNumber}`);
        }
    }

    // 2. Fix LoanTransaction (Sub-ledger) for LN005
    // It has a REPAYMENT of 10520.32. Should be 10019.35.
    const subTxs = await prisma.loanTransaction.findMany({
        where: {
            loanId: ln005.id,
            type: 'REPAYMENT'
        }
    });

    console.log(`Found ${subTxs.length} sub-ledger repayments.`);
    for (const stx of subTxs) {
        if (Number(stx.amount) === 10520.32) {
            await prisma.loanTransaction.update({
                where: { id: stx.id },
                data: {
                    amount: 10019.35,
                    principalAmount: 10000.00,
                    interestAmount: 19.35,
                    penaltyAmount: 0,
                    feeAmount: 0
                }
            });
            console.log(`  Adjusted sub-ledger amount to 10019.35`);
        }
    }

    // 3. Sync Outstanding Balance
    const { getLoanOutstandingBalance } = await import('../lib/accounting/AccountingEngine');
    const newBalance = await getLoanOutstandingBalance(ln005.id, prisma as any);
    await prisma.loan.update({
        where: { id: ln005.id },
        data: { outstandingBalance: newBalance }
    });
    console.log(`New Table Balance for LN005: ${newBalance}`);

    console.log('--- REPAIR COMPLETE ---');
}

deepRepair()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
