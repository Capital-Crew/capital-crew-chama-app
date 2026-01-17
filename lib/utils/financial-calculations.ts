/**
 * Financial Calculation Utilities
 * 
 * Pure mathematical functions for financial calculations.
 * All functions use Decimal for precision.
 * 
 * ALWAYS use these for financial math - NEVER use JavaScript number arithmetic.
 */

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calculate EMI (Equated Monthly Installment)
 * 
 * Uses the standard loan amortization formula:
 * EMI = P × [r × (1 + r)^n] / [(1 + r)^n - 1]
 * 
 * Where:
 * - P = Principal loan amount
 * - r = Periodic interest rate (as decimal, e.g., 0.01 for 1%)
 * - n = Number of installments
 * 
 * @param principal - Loan principal amount
 * @param periodicRate - Interest rate per period (as decimal, not percentage)
 * @param numberOfInstallments - Total number of payment periods
 * @returns EMI amount per installment
 */
export function calculateEMI(
    principal: Decimal,
    periodicRate: Decimal,
    numberOfInstallments: number
): Decimal {
    // Handle zero interest rate edge case
    if (periodicRate.equals(0)) {
        return principal.dividedBy(numberOfInstallments)
    }

    // Standard EMI formula
    const onePlusR = periodicRate.plus(1)
    const power = onePlusR.pow(numberOfInstallments)

    const numerator = principal.times(periodicRate).times(power)
    const denominator = power.minus(1)

    return numerator.dividedBy(denominator)
}

/**
 * Calculate Declining Balance Interest
 * 
 * Interest = Outstanding Balance × Interest Rate
 * 
 * @param balance - Outstanding principal balance
 * @param rate - Interest rate (as decimal, not percentage)
 * @returns Interest amount for the period
 */
export function calculateDecliningBalanceInterest(
    balance: Decimal,
    rate: Decimal
): Decimal {
    return balance.times(rate)
}

/**
 * Calculate Flat Interest
 * 
 * For flat rate loans, interest is calculated on original principal
 * and distributed evenly across all installments.
 * 
 * Total Interest = Principal × Rate × (Number of Periods / Periods per Year)
 * 
 * @param principal - Original loan principal
 * @param annualRate - Annual interest rate (as decimal)
 * @param numberOfInstallments - Total installments
 * @param periodsPerYear - How many periods in a year (12 for monthly, 52 for weekly, etc.)
 * @returns Total flat interest for the entire loan
 */
export function calculateFlatInterest(
    principal: Decimal,
    annualRate: Decimal,
    numberOfInstallments: number,
    periodsPerYear: number
): Decimal {
    const loanDurationInYears = new Decimal(numberOfInstallments).dividedBy(periodsPerYear)
    return principal.times(annualRate).times(loanDurationInYears)
}

/**
 * Convert Annual Rate to Periodic Rate
 * 
 * @param annualRate - Annual interest rate as percentage (e.g., 12 for 12%)
 * @param frequency - Payment frequency ('DAYS', 'WEEKS', 'MONTHS')
 * @param every - Frequency multiplier (e.g., every 2 weeks)
 * @returns Periodic interest rate as decimal
 */
export function calculatePeriodicRate(
    annualRate: Decimal,
    frequency: 'DAYS' | 'WEEKS' | 'MONTHS',
    every: number
): Decimal {
    // Convert percentage to decimal
    const annualRateDecimal = annualRate.dividedBy(100)

    // Calculate periods per year
    let periodsPerYear: number
    switch (frequency) {
        case 'DAYS':
            periodsPerYear = 365 / every
            break
        case 'WEEKS':
            periodsPerYear = 52 / every
            break
        case 'MONTHS':
            periodsPerYear = 12 / every
            break
        default:
            throw new Error(`Invalid frequency: ${frequency}`)
    }

    return annualRateDecimal.dividedBy(periodsPerYear)
}

/**
 * Add Period to Date
 * 
 * Utility to calculate next due date based on repayment frequency
 * 
 * @param date - Starting date
 * @param frequency - Payment frequency
 * @param every - Frequency multiplier
 * @returns New date after adding the period
 */
export function addPeriod(
    date: Date,
    frequency: 'DAYS' | 'WEEKS' | 'MONTHS',
    every: number
): Date {
    const newDate = new Date(date)

    switch (frequency) {
        case 'DAYS':
            newDate.setDate(newDate.getDate() + every)
            break
        case 'WEEKS':
            newDate.setDate(newDate.getDate() + (every * 7))
            break
        case 'MONTHS':
            newDate.setMonth(newDate.getMonth() + every)
            break
    }

    return newDate
}
