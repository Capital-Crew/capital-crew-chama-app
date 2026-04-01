/**
 * Loan Calculator Service
 * Handles loan repayment calculations for different amortization types
 */

export interface LoanCalculationInput {
    principal: number
    interestRatePerMonth: number // e.g., 2 for 2% per month
    installments: number
    amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
    interestType?: 'FLAT' | 'DECLINING_BALANCE' // defaults to DECLINING_BALANCE
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
 * Calculate monthly installment amount (used for summary display / reducing balance only)
 */
export function calculateMonthlyInstallment(input: LoanCalculationInput): number {
    const { principal, interestRatePerMonth, installments, amortizationType } = input
    const r = interestRatePerMonth / 100

    if (input.interestType === 'FLAT') {
        const totalInterest = principal * r * installments
        return Math.round(((principal + totalInterest) / installments) * 100) / 100
    }

    if (r === 0) return Math.round((principal / installments) * 100) / 100

    if (amortizationType === 'EQUAL_INSTALLMENTS') {
        const numerator = principal * r * Math.pow(1 + r, installments)
        const denominator = Math.pow(1 + r, installments) - 1
        return Math.round((numerator / denominator) * 100) / 100
    } else {
        const principalPerMonth = principal / installments
        const firstMonthInterest = principal * r
        return Math.round((principalPerMonth + firstMonthInterest) * 100) / 100
    }
}

/**
 * Generate full repayment schedule.
 * Supports FLAT rate (interest on original principal) and DECLINING_BALANCE (EMI reducing balance).
 */
export function generateRepaymentSchedule(
    input: LoanCalculationInput,
    disbursementDate: Date
): RepaymentScheduleItem[] {
    const { principal, interestRatePerMonth, installments, amortizationType, interestType = 'DECLINING_BALANCE' } = input
    const r = interestRatePerMonth / 100
    const schedule: RepaymentScheduleItem[] = []

    if (interestType === 'FLAT') {
        // FLAT RATE: Interest = Principal × rate × installments (spread evenly)
        const totalInterest = principal * r * installments
        const interestPerMonth = Math.round((totalInterest / installments) * 100) / 100
        const principalPerMonth = Math.round((principal / installments) * 100) / 100
        const totalPerMonth = Math.round((principalPerMonth + interestPerMonth) * 100) / 100
        let balance = principal

        for (let i = 1; i <= installments; i++) {
            const dueDate = new Date(disbursementDate)
            dueDate.setMonth(dueDate.getMonth() + i)

            const isLast = i === installments
            const principalDue = isLast ? Math.round(balance * 100) / 100 : principalPerMonth
            balance -= principalDue

            schedule.push({
                installmentNumber: i,
                dueDate,
                principalDue,
                interestDue: interestPerMonth,
                totalDue: Math.round((principalDue + interestPerMonth) * 100) / 100,
                balance: Math.round(Math.max(0, balance) * 100) / 100
            })
        }
        return schedule
    }

    // DECLINING BALANCE (Reducing Balance / EMI)
    let balance = principal
    for (let i = 1; i <= installments; i++) {
        const dueDate = new Date(disbursementDate)
        dueDate.setMonth(dueDate.getMonth() + i)

        let principalDue: number
        let interestDue: number

        if (amortizationType === 'EQUAL_INSTALLMENTS') {
            interestDue = balance * r
            const emi = calculateMonthlyInstallment(input)
            principalDue = emi - interestDue
        } else {
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
