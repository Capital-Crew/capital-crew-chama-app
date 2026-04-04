
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function auditLedger(loanNumber: string) {
    const loan = await db.loan.findFirst({
        where: { loanApplicationNumber: loanNumber }
    });

    if (!loan) {
        console.log(`Loan ${loanNumber} not found.`);
        return;
    }

    console.log(`Loan: ${loan.loanApplicationNumber} (${loan.id})`);
    
    const entries = await db.ledgerEntry.findMany({
        where: {
            description: { contains: loanNumber }
        },
        include: {
            ledgerAccount: true,
            ledgerTransaction: true
        },
        orderBy: {
            ledgerTransaction: { transactionDate: 'asc' }
        }
    });

    console.log('\n--- Ledger Entries ---');
    let totalDebit = 0;
    let totalCredit = 0;
    
    entries.forEach(e => {
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString()}] Acc: ${e.ledgerAccount.code} (${e.ledgerAccount.name}) - DR: ${e.debitAmount}, CR: ${e.creditAmount}, Desc: ${e.description}`);
        totalDebit += Number(e.debitAmount);
        totalCredit += Number(e.creditAmount);
    });

    console.log(`\nTotal Debit: ${totalDebit}`);
    console.log(`Total Credit: ${totalCredit}`);
    console.log(`Net Change: ${totalDebit - totalCredit}`);

    // Check LoanBalanceService logic
    const { LoanBalanceService } = await import('../services/loan-balance');
    const balance = await LoanBalanceService.calculateBalanceFromLedger(loan.id, db);
    console.log(`\nCalculated Balance via Service: ${balance}`);
}

auditLedger('LN003')
    .catch(console.error)
    .finally(() => db.$disconnect());
