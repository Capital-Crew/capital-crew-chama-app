
import { PrismaClient, LoanStatus } from '@prisma/client';
import { RepaymentCalculator } from '../lib/utils/repayment-calculator';
const prisma = new PrismaClient();

async function fixLoanInstallments(loanNumber: string) {
    console.log(`--- Fixing Installments for ${loanNumber} ---`);
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanNumber },
        include: { loanProduct: true }
    });

    if (!loan) return;

    // 1. Generate via RepaymentCalculator
    const scheduleData = RepaymentCalculator.generateSchedule(
        loan.id,
        {
            principal: Number(loan.amount),
            interestRatePerMonth: Number(loan.interestRate),
            installments: loan.installments,
            amortizationType: (loan.loanProduct.amortizationType as any) || 'EQUAL_INSTALLMENTS'
        },
        loan.disbursementDate || loan.applicationDate || new Date()
    );

    console.log(`Generated ${scheduleData.length} installments.`);

    // 2. Save
    await prisma.$transaction([
        prisma.repaymentInstallment.deleteMany({ where: { loanId: loan.id } }),
        prisma.repaymentInstallment.createMany({
            data: scheduleData.map(item => ({
                ...item,
                loanId: loan.id
            }))
        })
    ]);

    console.log('Saved.');
}

fixLoanInstallments('LN010')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
