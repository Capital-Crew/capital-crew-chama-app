
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugLoan(loanNumber: string) {
    console.log(`--- Debugging Loan: ${loanNumber} ---`);

    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanNumber },
        include: {
            member: true,
            topUps: true,
            transactions: {
                orderBy: { postedAt: 'asc' }
            }
        }
    });

    if (!loan) {
        console.log('Loan not found');
        return;
    }

    console.log(`ID: ${loan.id}`);
    console.log(`Status: ${loan.status}`);
    console.log(`Table Outstanding Balance: ${loan.outstandingBalance}`);

    console.log('\n--- Ledger Entries (Source of Truth) ---');
    const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerTransaction: {
                referenceId: loan.id,
                isReversed: false
            }
        },
        include: {
            ledgerAccount: {
                select: { name: true, code: true, type: true }
            },
            ledgerTransaction: {
                select: { transactionDate: true, description: true, referenceType: true }
            }
        },
        orderBy: {
            ledgerTransaction: {
                transactionDate: 'asc'
            }
        }
    });

    let runningBalance = 0;
    for (const entry of ledgerEntries) {
        const isAsset = entry.ledgerAccount.type === 'ASSET';
        const debit = Number(entry.debitAmount);
        const credit = Number(entry.creditAmount);

        const change = isAsset ? (debit - credit) : (credit - debit);
        // Only track balance for ASSET accounts (Receivables/Portfolio)
        if (isAsset) {
            runningBalance += change;
        }

        console.log(`[${entry.ledgerTransaction.transactionDate.toISOString().split('T')[0]}] ${entry.ledgerTransaction.referenceType.padEnd(15)} | ${entry.ledgerAccount.name.padEnd(25)} | DR: ${debit.toString().padStart(10)} | CR: ${credit.toString().padStart(10)} | Description: ${entry.ledgerTransaction.description}`);
    }

    console.log(`\nCalculated Asset Balance: ${runningBalance}`);

    console.log('\n--- Related Top-Ups ---');
    for (const tu of loan.topUps) {
        console.log(`TU -> Old Loan: ${tu.oldLoanNumber}, Principal: ${tu.principalBalance}, Fee: ${tu.refinanceFee}, Total: ${tu.totalOffset}`);
    }
}

const target = process.argv[2] || 'LN005';
debugLoan(target)
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
