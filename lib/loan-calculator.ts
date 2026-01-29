/**
 * Loan Calculator Service
 * Handles loan repayment calculations for different amortization types
 */

export interface LoanCalculationInput {
    principal: number
    interestRatePerMonth: number // e.g., 2 for 2%
    installments: number
    amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
}

export interface RepaymentScheduleItem {
    installmentNumber: number
    dueDate: Date
    principalDue: number
    interestDue: number
    totalDue: number
    balance: number
}

/**
 * Calculate monthly installment amount
 * @param input - Loan calculation parameters
 * @returns Monthly installment amount rounded to 2 decimals
 */
export function calculateMonthlyInstallment(input: LoanCalculationInput): number {
    const { principal, interestRatePerMonth, installments, amortizationType } = input
    const r = interestRatePerMonth / 100 // Convert 2% to 0.02

    if (r === 0) {
        // Zero interest: Simple division
        return Math.round((principal / installments) * 100) / 100
    }

    if (amortizationType === 'EQUAL_INSTALLMENTS') {
        // EMI Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
        // This ensures equal monthly payments with reducing interest
        const numerator = principal * r * Math.pow(1 + r, installments)
        const denominator = Math.pow(1 + r, installments) - 1
        const emi = numerator / denominator

        return Math.round(emi * 100) / 100 // Round to 2 decimals
    } else {
        // EQUAL_PRINCIPAL: Fixed principal + reducing interest
        // First month has highest payment (max principal + max interest)
        const principalPerMonth = principal / installments
        const firstMonthInterest = principal * r

        return Math.round((principalPerMonth + firstMonthInterest) * 100) / 100
    }
}

/**
 * Generate full repayment schedule
 * @param input - Loan calculation parameters
 * @param disbursementDate - Date when loan is disbursed
 * @returns Array of repayment schedule items
 */
export function generateRepaymentSchedule(
    input: LoanCalculationInput,
    disbursementDate: Date
): RepaymentScheduleItem[] {
    const { principal, interestRatePerMonth, installments, amortizationType } = input
    const r = interestRatePerMonth / 100
    const schedule: RepaymentScheduleItem[] = []
    let balance = principal

    for (let i = 1; i <= installments; i++) {
        const dueDate = new Date(disbursementDate)
        dueDate.setMonth(dueDate.getMonth() + i)

        let principalDue: number
        let interestDue: number

        if (amortizationType === 'EQUAL_INSTALLMENTS') {
            // EMI: Interest on remaining balance, principal is the difference
            interestDue = balance * r
            const emi = calculateMonthlyInstallment(input)
            principalDue = emi - interestDue
        } else {
            // EQUAL_PRINCIPAL: Fixed principal, reducing interest
            principalDue = principal / installments
            interestDue = balance * r
        }

        balance -= principalDue

        schedule.push({
            installmentNumber: i,
            dueDate,
            principalDue: Math.round(principalDue * 100) / 100,
            interestDue: Math.round(interestDue * 100) / 100,
            totalDue: Math.round((principalDue + interestDue) * 100) / 100,
            balance: Math.round(Math.max(0, balance) * 100) / 100
        })
    }

    return schedule
}

/**
 * Calculate accrued interest for a loan up to a specific date
 * @param principal - Outstanding principal amount
 * @param interestRatePerMonth - Monthly interest rate (e.g., 2 for 2%)
 * @param disbursementDate - Date when loan was disbursed
 * @param calculationDate - Date to calculate interest up to (defaults to now)
 * @returns Accrued interest amount
 */
export function calculateAccruedInterest(
    principal: number,
    interestRatePerMonth: number,
    disbursementDate: Date,
    calculationDate: Date = new Date()
): number {
    // Calculate months elapsed (using average month length of 30.44 days)
    const millisecondsPerMonth = 1000 * 60 * 60 * 24 * 30.44
    const monthsElapsed = Math.floor(
        (calculationDate.getTime() - disbursementDate.getTime()) / millisecondsPerMonth
    )

    const r = interestRatePerMonth / 100
    // Simple interest calculation
    // Note: Could be changed to compound interest if needed
    const interest = principal * r * monthsElapsed

    return Math.round(interest * 100) / 100
}

/**
 * Calculate total loan cost (principal + total interest)
 * @param input - Loan calculation parameters
 * @returns Object with total interest and total cost
 */
export function calculateTotalLoanCost(input: LoanCalculationInput): {
    totalInterest: number
    totalCost: number
    monthlyPayment: number
} {
    const monthlyPayment = calculateMonthlyInstallment(input)
    const totalCost = monthlyPayment * input.installments
    const totalInterest = totalCost - input.principal

    return {
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        monthlyPayment
    }
}
