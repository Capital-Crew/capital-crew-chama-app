
import { PrismaClient, ReferenceType } from '@prisma/client';
const prisma = new PrismaClient();

async function finalReconcile() {
    console.log('--- FINAL RECONCILIATION ---');

    const ln005 = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN005' } });
    const ln010 = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN010' } });

    const portAcc = await prisma.ledgerAccount.findFirst({ where: { code: '1310' } });
    const intAcc = await prisma.ledgerAccount.findFirst({ where: { code: '1320' } });
    const incomeAcc = await prisma.ledgerAccount.findFirst({ where: { code: '4100' } });

    if (!ln005 || !ln010 || !portAcc || !intAcc || !incomeAcc) {
        console.error('Missing records');
        return;
    }

    // Fix LN005: Add missing 19.35 interest accrual
    console.log('Fixing LN005: Adding 19.35 interest debt...');
    const tx005 = await prisma.ledgerTransaction.create({
        data: {
            transactionDate: new Date('2026-01-29'),
            referenceType: 'LOAN_INTEREST_ACCRUAL' as ReferenceType,
            referenceId: ln005.id,
            description: 'Legacy Interest Accrual Fix for LN005',
            totalAmount: 19.35,
            createdBy: 'SYSTEM',
            createdByName: 'System',
            ledgerEntries: {
                create: [
                    { ledgerAccountId: intAcc.id, debitAmount: 19.35, creditAmount: 0, description: 'Interest Accrual' },
                    { ledgerAccountId: incomeAcc.id, debitAmount: 0, creditAmount: 19.35, description: 'Interest Income' }
                ]
            }
        }
    });

    // Fix LN010: Ensure it has the Offset Debit (Principal from LN005 + Fee)
    // LN010 disbursed 20,000. 
    // It should have: DR 20,000 Portfolio.
    // It should have: CR 10,520.32 Offset (Wait! NO. Offset is a CREDIT for OLD LOAN, DEBIT for NEW LOAN).
    // Wait! In the offset logic:
    // New Loan DEBIT 20,000.
    // Disbursement 9079.68 (CR Wallet).
    // Offset 10019.35 (CR Old Loan).
    // Fee 500.97 (CR Income).
    // Total credits: 9079.68 + 10019.35 + 500.97 + 400 (Insurance?) = 20,000.

    // So LN010 balance should be 20,000.
    // It's correct in the ledger as DR 20,000.

    console.log('Syncing outstandingBalance fields...');
    const { LoanBalanceService } = await import('../services/loan-balance');
    await LoanBalanceService.updateLoanBalance(ln005.id, prisma as any);
    await LoanBalanceService.updateLoanBalance(ln010.id, prisma as any);

    console.log('--- RECONCILE COMPLETE ---');
}

finalReconcile()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
