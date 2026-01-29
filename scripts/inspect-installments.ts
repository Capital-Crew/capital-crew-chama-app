
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectInstallments(loanNumber: string) {
    console.log(`--- RepaymentInstallments: ${loanNumber} ---`);
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanNumber }
    });
    if (!loan) return;

    const insts = await prisma.repaymentInstallment.findMany({
        where: { loanId: loan.id },
        orderBy: { dueDate: 'asc' }
    });

    let totalDue = 0;
    let totalPaid = 0;
    for (const i of insts) {
        const due = Number(i.principalDue) + Number(i.interestDue) + Number(i.penaltyDue) + Number(i.feeDue);
        const paid = Number(i.principalPaid) + Number(i.interestPaid) + Number(i.penaltyPaid) + Number(i.feesPaid);
        totalDue += due;
        totalPaid += paid;
        console.log(`[${i.dueDate.toISOString().split('T')[0]}] Due: ${due.toString().padStart(10)} | Paid: ${paid.toString().padStart(10)} | FullyPaid: ${i.isFullyPaid}`);
    }
    console.log(`\nTotal Due: ${totalDue}`);
    console.log(`Total Paid: ${totalPaid}`);
    console.log(`Outstanding: ${totalDue - totalPaid}`);
}

inspectInstallments('LN005')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
