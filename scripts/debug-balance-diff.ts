
import { PrismaClient } from '@prisma/client';
import { getLoanOutstandingBalance } from '../lib/accounting/AccountingEngine';
import { getLoanPortfolio } from '../app/actions/member-dashboard-actions';

const prisma = new PrismaClient();

async function debugCompare(loanNumber: string) {
    console.log(`--- Debugging Balance for ${loanNumber} ---`);
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanNumber },
        include: { member: true }
    });

    if (!loan) {
        console.log('Loan not found');
        return;
    }

    // 1. Ledger Balance (Source of Truth for Model Field)
    const ledgerBalance = await getLoanOutstandingBalance(loan.id, prisma as any);
    console.log(`Ledger Balance (getLoanOutstandingBalance):  ${ledgerBalance}`);
    console.log(`Model Field (Stored):                       ${loan.outstandingBalance}`);

    console.log('\n--- Ledger Entry Audit (ASSET accounts linked to Loan ID) ---');
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerTransaction: {
                referenceId: loan.id,
                isReversed: false
            },
            ledgerAccount: { type: 'ASSET' }
        },
        include: { ledgerTransaction: true, ledgerAccount: true }
    });
    for (const e of entries) {
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}] ${e.ledgerAccount.code} | DR: ${e.debitAmount} | CR: ${e.creditAmount} | Desc: ${e.description || e.ledgerTransaction.description}`);
    }

    console.log('\n--- Searching Ledger Entries by Keyword "LN005" regardless of referenceId ---');
    const keywordEntries = await prisma.ledgerEntry.findMany({
        where: {
            OR: [
                { description: { contains: loanNumber } },
                { ledgerTransaction: { description: { contains: loanNumber } } }
            ]
        },
        include: { ledgerTransaction: true, ledgerAccount: true }
    });
    for (const e of keywordEntries) {
        if (e.ledgerAccount.type === 'ASSET') {
            console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}] ${e.ledgerAccount.code} | DR: ${e.debitAmount} | CR: ${e.creditAmount} | RefID: ${e.ledgerTransaction.referenceId} | Desc: ${e.description || e.ledgerTransaction.description}`);
        }
    }

    // 2. Statement Balance (Direct from LoanTransaction table)
    const portfolio = await getLoanPortfolio(loan.memberId);
    const item = portfolio.find(p => p.loanNumber === loanNumber);
    console.log(`Statement Balance (Calc):     ${item?.totalLoanBalance}`);
    console.log(`Statement Arrears:            ${item?.arrears}`);

    // If there is a mismatch, it means LoanTransaction and Ledger are out of sync.
}

debugCompare('LN005')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
