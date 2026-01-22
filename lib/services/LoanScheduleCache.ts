import { PrismaClient, Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { db } from '@/lib/db'

// Types based on the User's needs
export interface ScheduleItem {
    installmentNumber: number
    dueDate: string // Serialized date
    principalDue: number
    interestDue: number
    totalDue: number
    balance: number
}

/**
 * Loan Schedule Cache Service
 * Handles generation and caching of complex amortization schedules.
 * STRICTLY uses decimal.js for all arithmetic.
 */
export class LoanScheduleCache {

    /**
     * Generates the repayment schedule, saves it to the DB (cache), and returns it.
     */
    static async generateAndSaveSchedule(loanId: string): Promise<ScheduleItem[]> {
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: { loanProduct: true }
        })

        if (!loan) throw new Error("Loan not found")

        // 1. Gather Inputs (Convert to Decimal for precision)
        const principal = new Decimal(loan.amount.toString()) // Use toString to ensure precision from Prisma Decimal
        const ratePerPeriod = new Decimal(loan.interestRate.toString()) // Assuming this is period rate (e.g. 1.2% per month)
        const installments = new Decimal(loan.installments)
        const amortizationType = loan.loanProduct.amortizationType

        // 2. Perform Amortization Math
        const schedule: ScheduleItem[] = []
        let balance = principal
        const r = ratePerPeriod.div(100)

        // Calculate Monthly Installment (EMI) if applicable
        let emi = new Decimal(0)

        if (amortizationType === 'EQUAL_INSTALLMENTS') {
            // Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
            const onePlusR = r.plus(1)
            const power = onePlusR.pow(installments)

            const numerator = principal.times(r).times(power)
            const denominator = power.minus(1)

            if (denominator.isZero()) {
                emi = principal.div(installments) // Fallback for 0 interest
            } else {
                emi = numerator.div(denominator)
            }
        } else {
            // EQUAL_PRINCIPAL
            // No fixed EMI
        }

        const startDate = loan.disbursementDate || loan.applicationDate || new Date()

        for (let i = 1; i <= installments.toNumber(); i++) {
            let interestDue = balance.times(r)
            let principalDue = new Decimal(0)
            let totalDue = new Decimal(0)

            if (amortizationType === 'EQUAL_INSTALLMENTS') {
                principalDue = emi.minus(interestDue)
                totalDue = emi
            } else {
                // EQUAL_PRINCIPAL
                principalDue = principal.div(installments)
                totalDue = principalDue.plus(interestDue)
            }

            // Correction for last installment rounding issues
            if (i === installments.toNumber()) {
                if (balance.minus(principalDue).abs().lessThan(1)) {
                    principalDue = balance
                    totalDue = principalDue.plus(interestDue)
                }
            }

            balance = balance.minus(principalDue)
            // Clamp negative balance
            if (balance.isNegative()) balance = new Decimal(0)

            // Date Calculation
            const dueDate = new Date(startDate)
            dueDate.setMonth(dueDate.getMonth() + i)

            schedule.push({
                installmentNumber: i,
                dueDate: dueDate.toISOString(),
                principalDue: principalDue.toDecimalPlaces(2).toNumber(),
                interestDue: interestDue.toDecimalPlaces(2).toNumber(),
                totalDue: totalDue.toDecimalPlaces(2).toNumber(),
                balance: balance.toDecimalPlaces(2).toNumber()
            })
        }

        // 3. Save to Cache
        await db.loan.update({
            where: { id: loanId },
            data: {
                cachedSchedule: schedule as any
            }
        })

        return schedule
    }

    /**
     * Invalidate the cache for a specific loan.
     * Call this when Repayments are made or Loan terms change.
     */
    static async invalidateCache(loanId: string) {
        await db.loan.update({
            where: { id: loanId },
            data: { cachedSchedule: Prisma.DbNull } // Set to DbNull
        })
    }

    /**
     * Get Schedule with Read-Through Caching Strategy
     */
    static async getSchedule(loanId: string): Promise<ScheduleItem[]> {
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            select: { cachedSchedule: true }
        })

        if (loan?.cachedSchedule) {
            console.log(`[Cache] Hit for Loan ${loanId}`)
            return loan.cachedSchedule as any as ScheduleItem[]
        }

        console.log(`[Cache] Miss for Loan ${loanId}. Generating...`)
        return await this.generateAndSaveSchedule(loanId)
    }
}
