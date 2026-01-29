
import { PrismaClient } from '@prisma/client';
import { getLoanPortfolio } from '../app/actions/member-dashboard-actions';
const prisma = new PrismaClient();

async function compareBalances() {
    // Member for LN005
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN005' },
        include: { member: true }
    });

    if (!loan) {
        console.log('LN005 not found');
        return;
    }

    const memberId = loan.memberId;
    console.log(`Analyzing Member: ${loan.member.name} (${memberId})`);

    console.log('\n--- Dashboard Perspective ---');
    const portfolio = await getLoanPortfolio(memberId);
    for (const p of portfolio) {
        console.log(`Loan: ${p.loanNumber}`);
        console.log(`  Total Balance: ${p.totalLoanBalance}`);
        console.log(`  Principal:     ${p.principalBalance}`);
        console.log(`  Interest:      ${p.interestBalance}`);
        console.log(`  Arrears:       ${p.arrears}`);
    }

    console.log('\n--- Model Field Perspective ---');
    const loanRec = await prisma.loan.findUnique({
        where: { id: loan.id },
        select: { loanApplicationNumber: true, outstandingBalance: true }
    });
    console.log(`Loan ${loanRec?.loanApplicationNumber}: outstandingBalance = ${loanRec?.outstandingBalance}`);
}

compareBalances()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
