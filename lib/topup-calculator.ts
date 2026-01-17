/**
 * Top-Up Calculator Service
 * Handles calculations for loan offsets and refinancing
 */

import { calculateAccruedInterest } from './loan-calculator'

export interface LoanToOffset {
    loanId: string
    loanNumber: string
    productName: string
    outstandingPrincipal: number
    disbursementDate: Date
    interestRate: number
    currentPenalties: number
}

export interface TopUpCalculation {
    loanId: string
    loanNumber: string
    productName: string
    principalBalance: number
    accruedInterest: number
    penalties: number
    refinanceFee: number
    totalOffset: number
}

/**
 * Calculate top-up details for selected loans
 * @param loansToOffset - Array of loans to be offset
 * @param refinanceFeePercentage - Percentage fee for refinancing (e.g., 5 for 5%)
 * @returns Array of top-up calculations with breakdown
 */
export function calculateTopUpDetails(
    loansToOffset: LoanToOffset[],
    refinanceFeePercentage: number
): TopUpCalculation[] {
    return loansToOffset.map(loan => {
        // Calculate accrued interest up to today
        const accruedInterest = calculateAccruedInterest(
            loan.outstandingPrincipal,
            loan.interestRate,
            loan.disbursementDate,
            new Date()
        )

        // Calculate outstanding balance (principal + interest + penalties)
        const outstandingBalance = loan.outstandingPrincipal + accruedInterest + loan.currentPenalties

        // Calculate refinance fee (% of outstanding balance)
        const refinanceFee = Math.round(outstandingBalance * (refinanceFeePercentage / 100) * 100) / 100

        // Total offset amount (everything including refinance fee)
        const totalOffset = loan.outstandingPrincipal + accruedInterest + loan.currentPenalties + refinanceFee

        return {
            loanId: loan.loanId,
            loanNumber: loan.loanNumber,
            productName: loan.productName,
            principalBalance: loan.outstandingPrincipal,
            accruedInterest,
            penalties: loan.currentPenalties,
            refinanceFee,
            totalOffset: Math.round(totalOffset * 100) / 100
        }
    })
}

/**
 * Validate that net loan amount is positive after all deductions
 * @param newLoanAmount - Amount of new loan being applied for
 * @param topUpCalculations - Array of top-up calculations
 * @param processingFee - Processing fee amount
 * @param insuranceFee - Insurance fee amount
 * @param shareCapitalDeduction - Share capital deduction amount
 * @returns Validation result with net loan amount
 */
export function validateNetLoan(
    newLoanAmount: number,
    topUpCalculations: TopUpCalculation[],
    processingFee: number,
    insuranceFee: number,
    shareCapitalDeduction: number
): { valid: boolean; netLoan: number; error?: string } {
    // Calculate total top-up offset
    const totalTopUpOffset = topUpCalculations.reduce((sum, calc) => sum + calc.totalOffset, 0)

    // Calculate total deductions
    const totalDeductions = totalTopUpOffset + processingFee + insuranceFee + shareCapitalDeduction

    // Calculate net loan (what member actually receives)
    const netLoan = newLoanAmount - totalDeductions

    if (netLoan <= 0) {
        return {
            valid: false,
            netLoan: Math.round(netLoan * 100) / 100,
            error: `Net loan is Ksh ${netLoan.toLocaleString()}. Offsets and fees exceed loan amount. Please reduce offsets or increase loan amount.`
        }
    }

    return {
        valid: true,
        netLoan: Math.round(netLoan * 100) / 100
    }
}

/**
 * Calculate summary of all top-up offsets
 * @param topUpCalculations - Array of top-up calculations
 * @returns Summary object with totals
 */
export function calculateTopUpSummary(topUpCalculations: TopUpCalculation[]): {
    totalPrincipal: number
    totalInterest: number
    totalPenalties: number
    totalRefinanceFees: number
    totalOffset: number
    numberOfLoans: number
} {
    const summary = topUpCalculations.reduce(
        (acc, calc) => ({
            totalPrincipal: acc.totalPrincipal + calc.principalBalance,
            totalInterest: acc.totalInterest + calc.accruedInterest,
            totalPenalties: acc.totalPenalties + calc.penalties,
            totalRefinanceFees: acc.totalRefinanceFees + calc.refinanceFee,
            totalOffset: acc.totalOffset + calc.totalOffset,
            numberOfLoans: acc.numberOfLoans + 1
        }),
        {
            totalPrincipal: 0,
            totalInterest: 0,
            totalPenalties: 0,
            totalRefinanceFees: 0,
            totalOffset: 0,
            numberOfLoans: 0
        }
    )

    return {
        ...summary,
        totalPrincipal: Math.round(summary.totalPrincipal * 100) / 100,
        totalInterest: Math.round(summary.totalInterest * 100) / 100,
        totalPenalties: Math.round(summary.totalPenalties * 100) / 100,
        totalRefinanceFees: Math.round(summary.totalRefinanceFees * 100) / 100,
        totalOffset: Math.round(summary.totalOffset * 100) / 100
    }
}

/**
 * Check if member has active loans that can be offset
 * @param memberLoans - Member's active loans with balances
 * @returns Boolean indicating if offset is possible
 */
export function canOffsetLoans(memberLoans: { current_balance: number }[]): boolean {
    return memberLoans.some(loan => loan.current_balance > 0)
}
