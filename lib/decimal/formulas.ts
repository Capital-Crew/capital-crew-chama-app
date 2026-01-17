/**
 * Financial Formulas using Decimal.js
 * 
 * This module implements standard financial formulas with precise decimal arithmetic.
 * All calculations use decimal.js to eliminate floating-point errors.
 */

import Decimal from 'decimal.js-light'
import { MoneyDecimal, RateDecimal } from './config'
import { add, subtract, multiply, divide, isZero } from './operations'

// Type alias for Decimal values
type DecimalValue = Decimal.Value

// ============================================================================
// LOAN AMORTIZATION
// ============================================================================

/**
 * Calculate loan payment using amortization formula
 * 
 * Formula: Payment = Principal × [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 * - r = periodic interest rate (annual rate / periods per year)
 * - n = total number of payments
 * 
 * @param principal Loan amount
 * @param annualRate Annual interest rate (e.g., "0.12" for 12%)
 * @param periods Total number of payment periods
 * @returns Monthly payment amount
 * 
 * @example
 * calculateLoanPayment("10000", "0.12", 12) // Monthly payment for 1-year loan
 */
export function calculateLoanPayment(
    principal: Decimal.Value,
    annualRate: Decimal.Value,
    periods: number
): MoneyDecimal {
    const P = new MoneyDecimal(principal)
    const r = new RateDecimal(annualRate).dividedBy(12) // Monthly rate
    const n = periods

    // Handle zero interest rate
    if (r.isZero()) {
        return new MoneyDecimal(P.dividedBy(n))
    }

    // Calculate (1 + r)^n
    const onePlusR = r.plus(1)
    const onePlusRPowN = onePlusR.pow(n)

    // Calculate numerator: r(1+r)^n
    const numerator = r.times(onePlusRPowN)

    // Calculate denominator: (1+r)^n - 1
    const denominator = onePlusRPowN.minus(1)

    // Calculate payment: P × [numerator / denominator]
    const payment = P.times(numerator.dividedBy(denominator))

    return new MoneyDecimal(payment)
}

/**
 * Calculate reducing balance loan payment
 * This is the standard EMI (Equal Monthly Installment) calculation
 * 
 * @param principal Loan principal
 * @param annualInterestRate Annual interest rate (decimal, e.g., 0.12 for 12%)
 * @param numberOfMonths Loan term in months
 * @returns Monthly EMI payment
 */
export function calculateEMI(
    principal: Decimal.Value,
    annualInterestRate: Decimal.Value,
    numberOfMonths: number
): MoneyDecimal {
    return calculateLoanPayment(principal, annualInterestRate, numberOfMonths)
}

// ============================================================================
// INTEREST CALCULATIONS
// ============================================================================

/**
 * Calculate simple interest
 * 
 * Formula: Interest = Principal × Rate × Time
 * 
 * @param principal Principal amount
 * @param rate Interest rate (decimal)
 * @param time Time period (in years or fraction of year)
 * @returns Interest amount
 */
export function calculateSimpleInterest(
    principal: Decimal.Value,
    rate: Decimal.Value,
    time: Decimal.Value
): MoneyDecimal {
    const P = new MoneyDecimal(principal)
    const r = new RateDecimal(rate)
    const t = new Decimal(time)

    const interest = P.times(r).times(t)
    return new MoneyDecimal(interest)
}

/**
 * Calculate compound interest
 * 
 * Formula: Amount = Principal × (1 + rate/n)^(n×t)
 * Where:
 * - n = number of times interest is compounded per year
 * - t = time in years
 * 
 * @param principal Principal amount
 * @param annualRate Annual interest rate (decimal)
 * @param compoundingsPerYear Number of compounding periods per year
 * @param years Number of years
 * @returns Final amount (principal + interest)
 */
export function calculateCompoundInterest(
    principal: Decimal.Value,
    annualRate: Decimal.Value,
    compoundingsPerYear: number,
    years: Decimal.Value
): MoneyDecimal {
    const P = new MoneyDecimal(principal)
    const r = new RateDecimal(annualRate)
    const n = compoundingsPerYear
    const t = new Decimal(years)

    // Calculate (1 + r/n)
    const onePlusRateOverN = r.dividedBy(n).plus(1)

    // Calculate exponent: n × t
    const exponent = new Decimal(n).times(t)

    // Calculate final amount: P × (1 + r/n)^(n×t)
    const amount = P.times(onePlusRateOverN.pow(exponent.toNumber()))

    return new MoneyDecimal(amount)
}

/**
 * Calculate daily interest for a given principal and annual rate
 * 
 * @param principal Principal amount
 * @param annualRate Annual interest rate (decimal)
 * @param days Number of days
 * @returns Interest for the specified days
 */
export function calculateDailyInterest(
    principal: Decimal.Value,
    annualRate: Decimal.Value,
    days: number
): MoneyDecimal {
    const P = new MoneyDecimal(principal)
    const r = new RateDecimal(annualRate)
    const daysInYear = 365

    // Daily rate = annual rate / 365
    const dailyRate = r.dividedBy(daysInYear)

    // Interest = principal × daily rate × days
    const interest = P.times(dailyRate).times(days)

    return new MoneyDecimal(interest)
}

// ============================================================================
// PENALTY CALCULATIONS
// ============================================================================

/**
 * Calculate penalty for late payment
 * 
 * @param overdueAmount Amount that is overdue
 * @param penaltyRate Penalty rate (decimal, e.g., 0.05 for 5%)
 * @param daysOverdue Number of days overdue
 * @returns Penalty amount
 */
export function calculatePenalty(
    overdueAmount: Decimal.Value,
    penaltyRate: Decimal.Value,
    daysOverdue: number
): MoneyDecimal {
    // Calculate daily penalty
    const dailyPenalty = calculateDailyInterest(overdueAmount, penaltyRate, daysOverdue)
    return dailyPenalty
}

// ============================================================================
// FEE CALCULATIONS
// ============================================================================

/**
 * Calculate percentage-based fee
 * 
 * @param amount Base amount
 * @param feePercent Fee percentage (e.g., "2.5" for 2.5%)
 * @returns Fee amount
 */
export function calculatePercentageFee(
    amount: Decimal.Value,
    feePercent: Decimal.Value
): MoneyDecimal {
    const base = new MoneyDecimal(amount)
    const percent = new RateDecimal(feePercent)

    const fee = base.times(percent.dividedBy(100))
    return new MoneyDecimal(fee)
}

/**
 * Calculate total amount including fee
 * 
 * @param amount Base amount
 * @param feePercent Fee percentage
 * @returns Total amount (base + fee)
 */
export function calculateAmountWithFee(
    amount: Decimal.Value,
    feePercent: Decimal.Value
): MoneyDecimal {
    const base = new MoneyDecimal(amount)
    const fee = calculatePercentageFee(amount, feePercent)

    return new MoneyDecimal(base.plus(fee))
}

// ============================================================================
// LOAN BALANCE CALCULATIONS
// ============================================================================

/**
 * Calculate remaining balance after a payment
 * 
 * @param currentBalance Current loan balance
 * @param payment Payment amount
 * @param interestCharged Interest charged this period
 * @returns New balance
 */
export function calculateRemainingBalance(
    currentBalance: Decimal.Value,
    payment: Decimal.Value,
    interestCharged: Decimal.Value
): MoneyDecimal {
    const balance = new MoneyDecimal(currentBalance)
    const pmt = new MoneyDecimal(payment)
    const interest = new MoneyDecimal(interestCharged)

    // New balance = current balance + interest - payment
    const newBalance = balance.plus(interest).minus(pmt)

    // Ensure balance doesn't go negative
    return new MoneyDecimal(newBalance.greaterThan(0) ? newBalance : 0)
}

/**
 * Split payment into principal and interest components
 * 
 * @param payment Total payment amount
 * @param currentBalance Current loan balance
 * @param interestDue Interest due this period
 * @returns Object with principal and interest portions
 */
export function splitPayment(
    payment: Decimal.Value,
    currentBalance: Decimal.Value,
    interestDue: Decimal.Value
): { principal: MoneyDecimal; interest: MoneyDecimal } {
    const pmt = new MoneyDecimal(payment)
    const interest = new MoneyDecimal(interestDue)
    const balance = new MoneyDecimal(currentBalance)

    // Interest portion is the lesser of interest due or payment amount
    const interestPortion = new MoneyDecimal(
        interest.lessThan(pmt) ? interest : pmt
    )

    // Principal portion is remainder
    const principalPortion = new MoneyDecimal(pmt.minus(interestPortion))

    // Ensure principal doesn't exceed balance
    const finalPrincipal = new MoneyDecimal(
        principalPortion.lessThan(balance) ? principalPortion : balance
    )

    return {
        principal: finalPrincipal,
        interest: interestPortion,
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate percentage change between two values
 * 
 * @param oldValue Original value
 * @param newValue New value
 * @returns Percentage change (positive for increase, negative for decrease)
 */
export function calculatePercentageChange(
    oldValue: Decimal.Value,
    newValue: Decimal.Value
): Decimal {
    const old = new Decimal(oldValue)
    const newVal = new Decimal(newValue)

    if (old.isZero()) {
        throw new Error('Cannot calculate percentage change from zero')
    }

    const change = newVal.minus(old)
    const percentChange = change.dividedBy(old).times(100)

    return percentChange
}

/**
 * Prorate an amount based on days
 * 
 * @param annualAmount Annual amount
 * @param days Number of days to prorate
 * @returns Prorated amount
 */
export function prorateAmount(
    annualAmount: Decimal.Value,
    days: number
): MoneyDecimal {
    const annual = new MoneyDecimal(annualAmount)
    const daysInYear = 365

    const prorated = annual.times(days).dividedBy(daysInYear)
    return new MoneyDecimal(prorated)
}
