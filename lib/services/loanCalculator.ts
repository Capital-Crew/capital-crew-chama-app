import Decimal from 'decimal.js'

// Set decimal precision and rounding mode for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export type InterestType = 'FLAT' | 'DECLINING_BALANCE'

export interface LoanCalculationInput {
    principal: number
    annualInterestRate: number // e.g., 14 for 14%
    durationMonths: number
    interestType: InterestType
    startDate?: Date
}

export interface PaymentScheduleItem {
    monthNo: number
    date: Date
    principalPayment: number
    interestPayment: number
    totalPayment: number
    remainingBalance: number
}

export interface LoanScheduleResult {
    summary: {
        monthlyPaymentAmount: number
        totalInterest: number
        totalPayable: number
    }
    schedule: PaymentScheduleItem[]
}

/**
 * Calculate loan payment schedule with precise decimal arithmetic
 * Supports both FLAT and DECLINING_BALANCE (reducing balance) interest calculations
 */
export function calculateLoanSchedule(input: LoanCalculationInput): LoanScheduleResult {
    const { principal, annualInterestRate, durationMonths, interestType, startDate = new Date() } = input

    // Convert to Decimal for precision
    const P = new Decimal(principal)
    const annualRate = new Decimal(annualInterestRate).div(100)
    const n = durationMonths

    if (interestType === 'FLAT') {
        return calculateFlatRateSchedule(P, annualRate, n, startDate)
    } else {
        return calculateDecliningBalanceSchedule(P, annualRate, n, startDate)
    }
}

/**
 * FLAT RATE Calculation
 * Total Interest = Principal × Rate × (Duration/12)
 * Monthly Payment = (Principal + Total Interest) / Duration
 */
function calculateFlatRateSchedule(
    principal: Decimal,
    annualRate: Decimal,
    months: number,
    startDate: Date
): LoanScheduleResult {
    // Calculate total interest for entire loan period
    const totalInterest = principal.times(annualRate).times(months).div(12)
    const totalPayable = principal.plus(totalInterest)
    const monthlyPayment = totalPayable.div(months)

    // Fixed principal and interest per month
    const principalPerMonth = principal.div(months)
    const interestPerMonth = totalInterest.div(months)

    const schedule: PaymentScheduleItem[] = []
    let remainingBalance = new Decimal(principal)

    for (let month = 1; month <= months; month++) {
        // Calculate payment date
        const paymentDate = new Date(startDate)
        paymentDate.setMonth(paymentDate.getMonth() + month)

        // For the last month, ensure balance goes to exactly zero
        const principalPayment = month === months
            ? remainingBalance
            : principalPerMonth

        remainingBalance = remainingBalance.minus(principalPayment)

        schedule.push({
            monthNo: month,
            date: paymentDate,
            principalPayment: Number(principalPayment.toFixed(2)),
            interestPayment: Number(interestPerMonth.toFixed(2)),
            totalPayment: Number(monthlyPayment.toFixed(2)),
            remainingBalance: Number(remainingBalance.toFixed(2))
        })
    }

    return {
        summary: {
            monthlyPaymentAmount: Number(monthlyPayment.toFixed(2)),
            totalInterest: Number(totalInterest.toFixed(2)),
            totalPayable: Number(totalPayable.toFixed(2))
        },
        schedule
    }
}

/**
 * DECLINING BALANCE (Reducing Balance) Calculation
 * Uses standard loan amortization formula (PMT)
 * Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]
 * Where r = monthly interest rate, n = number of months
 */
function calculateDecliningBalanceSchedule(
    principal: Decimal,
    annualRate: Decimal,
    months: number,
    startDate: Date
): LoanScheduleResult {
    // Calculate monthly interest rate
    const monthlyRate = annualRate.div(12)

    // PMT formula: P × [r(1+r)^n] / [(1+r)^n - 1]
    const onePlusR = monthlyRate.plus(1)
    const onePlusRPowN = onePlusR.pow(months)
    const numerator = principal.times(monthlyRate).times(onePlusRPowN)
    const denominator = onePlusRPowN.minus(1)

    // Monthly payment amount (EMI)
    const monthlyPayment = numerator.div(denominator)

    const schedule: PaymentScheduleItem[] = []
    let remainingBalance = new Decimal(principal)
    let totalInterestPaid = new Decimal(0)

    for (let month = 1; month <= months; month++) {
        // Calculate payment date
        const paymentDate = new Date(startDate)
        paymentDate.setMonth(paymentDate.getMonth() + month)

        // Interest portion = remaining balance × monthly rate
        const interestPayment = remainingBalance.times(monthlyRate)

        // Principal portion = monthly payment - interest
        let principalPayment = monthlyPayment.minus(interestPayment)

        // For the last month, adjust to ensure balance is exactly zero
        if (month === months) {
            principalPayment = remainingBalance
            // Recalculate final payment to match remaining balance + final interest
            const finalPayment = principalPayment.plus(interestPayment)

            remainingBalance = new Decimal(0)
            totalInterestPaid = totalInterestPaid.plus(interestPayment)

            schedule.push({
                monthNo: month,
                date: paymentDate,
                principalPayment: Number(principalPayment.toFixed(2)),
                interestPayment: Number(interestPayment.toFixed(2)),
                totalPayment: Number(finalPayment.toFixed(2)),
                remainingBalance: 0.00
            })
        } else {
            remainingBalance = remainingBalance.minus(principalPayment)
            totalInterestPaid = totalInterestPaid.plus(interestPayment)

            schedule.push({
                monthNo: month,
                date: paymentDate,
                principalPayment: Number(principalPayment.toFixed(2)),
                interestPayment: Number(interestPayment.toFixed(2)),
                totalPayment: Number(monthlyPayment.toFixed(2)),
                remainingBalance: Number(remainingBalance.toFixed(2))
            })
        }
    }

    const totalPayable = new Decimal(principal).plus(totalInterestPaid)

    return {
        summary: {
            monthlyPaymentAmount: Number(monthlyPayment.toFixed(2)),
            totalInterest: Number(totalInterestPaid.toFixed(2)),
            totalPayable: Number(totalPayable.toFixed(2))
        },
        schedule
    }
}
