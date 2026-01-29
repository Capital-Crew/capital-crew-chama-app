
import { PrismaClient } from '@prisma/client';
import { getLoanOutstandingBalance } from '../lib/accounting/AccountingEngine';

const prisma = new PrismaClient();

async function auditAll() {
    console.log('--- GLOBAL LOAN BALANCE AUDIT ---');
    const loans = await prisma.loan.findMany();

    for (const loan of loans) {
        const ledgerBal = await getLoanOutstandingBalance(loan.id);
        const diff = Number(loan.outstandingBalance) - ledgerBal;

        if (Math.abs(diff) > 0.01) {
            console.log(`Mismatch [${loan.loanApplicationNumber}]: Table ${loan.outstandingBalance} vs Ledger ${ledgerBal} (Diff: ${diff})`);
        } else {
            console.log(`Match [${loan.loanApplicationNumber}]: ${ledgerBal}`);
        }
    }
}

auditAll()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
