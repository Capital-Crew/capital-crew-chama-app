import { calculateLoanSchedule } from './loanCalculator'
import { Prisma } from '@prisma/client'

/**
 * Service to generate the static Repayment Schedule for a Loan.
 * This does NOT save to the DB, but prepares the objects for `prisma.repaymentInstallment.createMany`.
 */
export class ScheduleGeneratorService {
    /**
     * Generates a list of RepaymentInstallment create inputs
     */
    static generate(
        principal: number,
        interestRate: number,
        durationMonths: number,
        interestType: 'FLAT' | 'DECLINING_BALANCE',
        startDate: Date,
        loanId: string // Optional if we want to include it now, or map later
    ): Omit<Prisma.RepaymentInstallmentCreateManyInput, 'loanId'>[] {

        const result = calculateLoanSchedule({
            principal,
            annualInterestRate: interestRate,
            durationMonths,
            interestType,
            startDate
        })

        return result.schedule.map(item => ({
            installmentNumber: item.monthNo,
            dueDate: item.date,
            principalDue: new Prisma.Decimal(item.principalPayment),
            interestDue: new Prisma.Decimal(item.interestPayment),
            // Default 0 for paid fields
            principalPaid: new Prisma.Decimal(0),
            interestPaid: new Prisma.Decimal(0),
            penaltyPaid: new Prisma.Decimal(0),
            feesPaid: new Prisma.Decimal(0),
            isFullyPaid: false
        }))
    }
}
