
import { PrismaClient } from '@prisma/client';
import { getLoanOutstandingBalance } from '../lib/accounting/AccountingEngine';
import { toDecimal } from '../lib/financialMath';

const prisma = new PrismaClient();

async function debugBalance(loanNumber: string) {
    const loan = await prisma.loan.findFirst({ where: { loanApplicationNumber: loanNumber } });
    if (!loan) return;

    console.log(`--- Debugging getLoanOutstandingBalance("${loanNumber}") ---`);

    // Manual replication of the query in getLoanOutstandingBalance to see exactly what's fetched
    const lines = await prisma.ledgerEntry.findMany({
        where: {
            ledgerTransaction: { isReversed: false },
            ledgerAccount: { type: 'ASSET' },
            OR: [
                {
                    ledgerTransaction: { referenceId: loan.id },
                    NOT: {
                        AND: [
                            { description: { contains: 'LN' } },
                            { NOT: { description: { contains: loanNumber } } }
                        ]
                    }
                },
                {
                    description: { contains: loanNumber }
                }
            ]
        },
        include: {
            ledgerAccount: true,
            ledgerTransaction: true
        }
    });

    console.log(`Found ${lines.length} lines.`);
    let balance = toDecimal(0);
    for (const line of lines) {
        const movement = toDecimal(line.debitAmount).minus(line.creditAmount);
        balance = balance.plus(movement);
        console.log(`  [${line.ledgerAccount.code}] DR: ${line.debitAmount} | CR: ${line.creditAmount} | Move: ${movement} | Desc: ${line.description || line.ledgerTransaction.description}`);
    }

    console.log(`Final Calculated Balance: ${balance}`);
}

const loanNumber = process.argv[2] || 'LN005';
debugBalance(loanNumber)
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
