
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function refSearch(loanNo: string) {
    const loan = await prisma.loan.findFirst({ where: { loanApplicationNumber: loanNo } });
    if (!loan) return;

    console.log(`--- REF SEARCH: "${loan.id}" (${loanNo}) ---`);
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerTransaction: { referenceId: loan.id }
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    });

    for (const e of entries) {
        console.log(`ID: ${e.id} | Acc: ${e.ledgerAccount.code} (${e.ledgerAccount.type}) | DR: ${e.debitAmount} | CR: ${e.creditAmount} | Desc: ${e.description || e.ledgerTransaction.description}`);
    }
}

refSearch(process.argv[2] || 'LN008')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
