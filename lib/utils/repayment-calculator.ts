import { LoanCalculationInput, generateRepaymentSchedule as legacyGenerateSchedule } from '../loan-calculator';
import { Prisma } from '@prisma/client';

export class RepaymentCalculator {
    /**
     * Generates a list of repayment schedule records ready for database insertion.
     * Supports FLAT and DECLINING_BALANCE interest types read from the loan product.
     */
    static generateSchedule(
        loanId: string,
        input: LoanCalculationInput,
        disbursementDate: Date
    ) {
        const legacySchedule = legacyGenerateSchedule(input, disbursementDate);

        return legacySchedule.map(item => ({
            loanId,
            installmentNumber: item.installmentNumber,
            dueDate: item.dueDate,
            principalDue: new Prisma.Decimal(item.principalDue),
            interestDue: new Prisma.Decimal(item.interestDue),
            principalPaid: new Prisma.Decimal(0),
            interestPaid: new Prisma.Decimal(0),
            penaltyDue: new Prisma.Decimal(0),
            penaltyPaid: new Prisma.Decimal(0),
            isFullyPaid: false
        }));
    }
}
