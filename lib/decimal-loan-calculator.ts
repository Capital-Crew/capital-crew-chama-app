/**
 * Decimal-Based Loan Calculator
 * 
 * This replaces the legacy loan-calculator.ts with decimal.js operations
 * to ensure precise financial calculations without floating-point errors.
 */

import { MoneyDecimal, RateDecimal } from '@/lib/decimal/config'
import { calculateEMI, splitPayment } from '@/lib/decimal/formulas'
import { roundForStorage, roundForDisplay } from '@/lib/decimal/operations'
import Decimal from 'decimal.js-light'

export interface DecimalLoanCalculationInput {
    principal: string | Decimal  // Loan amount
    interestRatePerMonth: string | Decimal  // Monthly rate as percentage (e.g., "2" for 2%)
    installments: number  // Number of months
    amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
}

export interface DecimalRepaymentScheduleItem {
    installmentNumber: number
    dueDate: Date
    principalDue: Decimal
    interestDue: Decimal
    totalDue: Decimal
    balance: Decimal
}

/**
 * Calculate monthly installment amount using decimal precision
 * @param input - Loan calculation parameters
 * @returns Monthly installment amount as Decimal
 */
export function calculateMonthlyInstallmentDecimal(input: DecimalLoanCalculationInput): MoneyDecimal {
    const { principal, interestRatePerMonth, installments, amortizationType } = input

    const P = new MoneyDecimal(principal)
    const rPercent = new RateDecimal(interestRatePerMonth)
    const r = rPercent.dividedBy(100) // Convert 2% to 0.02
    const n = installments

    if (amortizationType === 'EQUAL_INSTALLMENTS') {
        // EMI Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
        if (r.isZero()) {
            // No interest, just divide principal by installments
            return new MoneyDecimal(P.dividedBy(n))
        }

        const onePlusR = r.plus(1)
        const onePlusRPowN = onePlusR.pow(n)
        const numerator = P.times(r).times(onePlusRPowN)
        const denominator = onePlusRPowN.minus(1)
        const emi = numerator.dividedBy(denominator)

        return new MoneyDecimal(roundForStorage(emi))
    } else {
        // EQUAL_PRINCIPAL: Fixed principal + reducing interest
        // First month has highest payment (max principal + max interest)
        const principalPerMonth = P.dividedBy(n)
        const firstMonthInterest = P.times(r)
        const firstPayment = principalPerMonth.plus(firstMonthInterest)

        return new MoneyDecimal(roundForStorage(firstPayment))
    }
}

/**
 * Generate full repayment schedule with decimal precision
 * @param input - Loan calculation parameters
 * @param disbursementDate - Date when loan is disbursed
 * @returns Array of repayment schedule items
 */
export function generateRepaymentScheduleDecimal(
    input: DecimalLoanCalculationInput,
    disbursementDate: Date
): DecimalRepaymentScheduleItem[] {
    const { principal, interestRatePerMonth, installments, amortizationType } = input

    const P = new MoneyDecimal(principal)
    const rPercent = new RateDecimal(interestRatePerMonth)
    const r = rPercent.dividedBy(100)
    const schedule: DecimalRepaymentScheduleItem[] = []
    let balance = new MoneyDecimal(P)

    for (let i = 1; i <= installments; i++) {
        const dueDate = new Date(disbursementDate)
        dueDate.setMonth(dueDate.getMonth() + i)

        let principalDue: Decimal
        let interestDue: Decimal

        if (amortizationType === 'EQUAL_INSTALLMENTS') {
            // EMI: Interest on remaining balance, principal is the difference
            interestDue = balance.times(r)
            const emi = calculateMonthlyInstallmentDecimal(input)
            principalDue = emi.minus(interestDue)

            // Ensure principal doesn't exceed balance (last installment adjustment)
            if (principalDue.greaterThan(balance)) {
                principalDue = balance
            }
        } else {
            // EQUAL_PRINCIPAL: Fixed principal, reducing interest
            principalDue = P.dividedBy(installments)
            interestDue = balance.times(r)

            // Last installment adjustment
            if (principalDue.greaterThan(balance)) {
                principalDue = balance
            }
        }

        balance = balance.minus(principalDue)

        // Ensure balance doesn't go negative
        if (balance.lessThan(0)) {
            balance = new MoneyDecimal(0)
        }

        const totalDue = new MoneyDecimal(principalDue).plus(interestDue)

        schedule.push({
            installmentNumber: i,
            dueDate,
            principalDue: roundForStorage(principalDue),
            interestDue: roundForStorage(interestDue),
            totalDue: roundForStorage(totalDue),
            balance: roundForStorage(balance)
        })
    }

    return schedule
}

/**
 * Calculate accrued interest for a loan up to a specific date
 * @param principal - Outstanding principal amount
 * @param interestRatePerMonth - Monthly interest rate (e.g., "2" for 2%)
 * @param disbursementDate - Date when loan was disbursed
 * @param calculationDate - Date to calculate interest up to (defaults to now)
 * @returns Accrued interest amount as Decimal
 */
export function calculateAccruedInterestDecimal(
    principal: string | Decimal,
    interestRatePerMonth: string | Decimal,
    disbursementDate: Date,
    calculationDate: Date = new Date()
): MoneyDecimal {
    const P = new MoneyDecimal(principal)
    const rPercent = new RateDecimal(interestRatePerMonth)
    const r = rPercent.dividedBy(100)

    // Calculate months elapsed (using average month length of 30.44 days)
    const millisecondsPerMonth = 1000 * 60 * 60 * 24 * 30.44
    const monthsElapsed = Math.floor(
        (calculationDate.getTime() - disbursementDate.getTime()) / millisecondsPerMonth
    )

    // Simple interest calculation
    const interest = P.times(r).times(monthsElapsed)

    return new MoneyDecimal(roundForStorage(interest))
}

/**
 * Calculate total loan cost (principal + total interest)
 * @param input - Loan calculation parameters
 * @returns Object with total interest and total cost
 */
export function calculateTotalLoanCostDecimal(input: DecimalLoanCalculationInput): {
    totalInterest: Decimal
    totalCost: Decimal
    monthlyPayment: Decimal
} {
    const monthlyPayment = calculateMonthlyInstallmentDecimal(input)
    const totalCost = monthlyPayment.times(input.installments)
    const P = new MoneyDecimal(input.principal)
    const totalInterest = totalCost.minus(P)

    return {
        totalInterest: roundForStorage(totalInterest),
        totalCost: roundForStorage(totalCost),
        monthlyPayment: roundForStorage(monthlyPayment)
    }
}

/**
 * Legacy compatibility wrapper - converts number inputs to Decimal
 * @deprecated Use calculateMonthlyInstallmentDecimal instead
 */
export function calculateMonthlyInstallment(input: {
    principal: number
    interestRatePerMonth: number
    installments: number
    amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
}): number {
    const result = calculateMonthlyInstallmentDecimal({
        principal: input.principal.toString(),
        interestRatePerMonth: input.interestRatePerMonth.toString(),
        installments: input.installments,
        amortizationType: input.amortizationType
    })
    return parseFloat(result.toFixed(2))
}

/**
 * Legacy compatibility wrapper - converts Decimal results to numbers
 * @deprecated Use generateRepaymentScheduleDecimal instead
 */
export function generateRepaymentSchedule(
    input: {
        principal: number
        interestRatePerMonth: number
        installments: number
        amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
    },
    disbursementDate: Date
): Array<{
    installmentNumber: number
    dueDate: Date
    principalDue: number
    interestDue: number
    totalDue: number
    balance: number
}> {
    const decimalSchedule = generateRepaymentScheduleDecimal({
        principal: input.principal.toString(),
        interestRatePerMonth: input.interestRatePerMonth.toString(),
        installments: input.installments,
        amortizationType: input.amortizationType
    }, disbursementDate)

    return decimalSchedule.map(item => ({
        installmentNumber: item.installmentNumber,
        dueDate: item.dueDate,
        principalDue: parseFloat(item.principalDue.toFixed(2)),
        interestDue: parseFloat(item.interestDue.toFixed(2)),
        totalDue: parseFloat(item.totalDue.toFixed(2)),
        balance: parseFloat(item.balance.toFixed(2))
    }))
}

// Re-export types for backward compatibility
export type LoanCalculationInput = {
    principal: number
    interestRatePerMonth: number
    installments: number
    amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
}

export type RepaymentScheduleItem = {
    installmentNumber: number
    dueDate: Date
    principalDue: number
    interestDue: number
    totalDue: number
    balance: number
}
