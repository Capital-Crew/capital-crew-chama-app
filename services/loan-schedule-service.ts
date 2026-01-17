/**
 * Loan Schedule Service - Pure Calculation Layer
 * 
 * Generates amortization schedules for loans.
 * This service has NO database coupling - pure business logic.
 * 
 * Can be used for:
 * - Generating schedules on loan disbursement
 * - Recalculating schedules after restructuring
 * - Preview schedules in loan application
 * - What-if analysis
 */

import { Decimal } from '@prisma/client/runtime/library'
import {
    calculateEMI,
    calculateDecliningBalanceInterest,
    calculatePeriodicRate,
    addPeriod
} from '@/lib/utils/financial-calculations'

// ========================================
// TYPES
// ========================================

export interface ScheduleGenerationParams {
    principal: Decimal
    interestRatePerPeriod: Decimal  // Annual percentage (e.g., 12 for 12%)
    numberOfInstallments: number
    repaymentFrequency: 'DAYS' | 'WEEKS' | 'MONTHS'
    repaymentEvery: number
    disbursementDate: Date
    amortizationType: 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL'
    interestType: 'FLAT' | 'DECLINING_BALANCE'
    graceOnPrincipal?: number  // Number of grace installments
    graceOnInterest?: number   // Number of grace installments
}

export interface ScheduleInstallment {
    installmentNumber: number
    fromDate: Date
    dueDate: Date
    principal: Decimal
    interest: Decimal
    totalDue: Decimal
    balance: Decimal
}

// ========================================
// SERVICE
// ========================================

export class LoanScheduleService {
    /**
     * Generate Repayment Schedule
     * 
     * Creates a complete amortization schedule based on loan parameters.
     * Returns array of installments with dates, amounts, and balances.
     */
    static generateSchedule(
        params: ScheduleGenerationParams
    ): ScheduleInstallment[] {
        // Validate inputs
        if (params.principal.lte(0)) {
            throw new Error('Principal must be greater than zero')
        }
        if (params.numberOfInstallments <= 0) {
            throw new Error('Number of installments must be greater than zero')
        }

        // Route to appropriate calculation method
        if (params.amortizationType === 'EQUAL_INSTALLMENTS') {
            return this.generateEqualInstallmentSchedule(params)
        } else {
            return this.generateEqualPrincipalSchedule(params)
        }
    }

    /**
     * Equal Installment Schedule (EMI)
     * 
     * Each installment has the same total payment amount.
     * Interest decreases and principal increases over time.
     */
    private static generateEqualInstallmentSchedule(
        params: ScheduleGenerationParams
    ): ScheduleInstallment[] {
        const installments: ScheduleInstallment[] = []

        // Calculate periodic interest rate
        const periodicRate = calculatePeriodicRate(
            params.interestRatePerPeriod,
            params.repaymentFrequency,
            params.repaymentEvery
        )

        // Calculate EMI
        const emi = calculateEMI(
            params.principal,
            periodicRate,
            params.numberOfInstallments
        )

        let balance = params.principal
        let currentDate = params.disbursementDate
        const graceOnPrincipal = params.graceOnPrincipal || 0
        const graceOnInterest = params.graceOnInterest || 0

        for (let i = 1; i <= params.numberOfInstallments; i++) {
            const fromDate = currentDate
            const dueDate = addPeriod(
                currentDate,
                params.repaymentFrequency,
                params.repaymentEvery
            )

            // Calculate interest on outstanding balance
            const interestAmount = i <= graceOnInterest
                ? new Decimal(0)
                : calculateDecliningBalanceInterest(balance, periodicRate)

            // Principal = EMI - Interest (for declining balance)
            // For flat rate, principal is distributed evenly
            let principalAmount: Decimal

            if (i <= graceOnPrincipal) {
                principalAmount = new Decimal(0)
            } else if (i === params.numberOfInstallments) {
                // Last installment: pay remaining balance
                principalAmount = balance
            } else {
                principalAmount = emi.minus(interestAmount)
            }

            // Update balance
            balance = balance.minus(principalAmount)

            installments.push({
                installmentNumber: i,
                fromDate,
                dueDate,
                principal: principalAmount,
                interest: interestAmount,
                totalDue: principalAmount.plus(interestAmount),
                balance: balance.greaterThan(0) ? balance : new Decimal(0)
            })

            currentDate = dueDate
        }

        return installments
    }

    /**
     * Equal Principal Schedule
     * 
     * Principal amount is the same in each installment.
     * Interest decreases over time (calculated on declining balance).
     * Total payment decreases each period.
     */
    private static generateEqualPrincipalSchedule(
        params: ScheduleGenerationParams
    ): ScheduleInstallment[] {
        const installments: ScheduleInstallment[] = []

        // Calculate periodic interest rate
        const periodicRate = calculatePeriodicRate(
            params.interestRatePerPeriod,
            params.repaymentFrequency,
            params.repaymentEvery
        )

        // Calculate equal principal per installment
        const principalPerInstallment = params.principal.dividedBy(
            params.numberOfInstallments
        )

        let balance = params.principal
        let currentDate = params.disbursementDate
        const graceOnPrincipal = params.graceOnPrincipal || 0
        const graceOnInterest = params.graceOnInterest || 0

        for (let i = 1; i <= params.numberOfInstallments; i++) {
            const fromDate = currentDate
            const dueDate = addPeriod(
                currentDate,
                params.repaymentFrequency,
                params.repaymentEvery
            )

            // Interest on outstanding balance
            const interestAmount = i <= graceOnInterest
                ? new Decimal(0)
                : calculateDecliningBalanceInterest(balance, periodicRate)

            // Principal amount
            const principalAmount = i <= graceOnPrincipal
                ? new Decimal(0)
                : principalPerInstallment

            // Update balance
            balance = balance.minus(principalAmount)

            installments.push({
                installmentNumber: i,
                fromDate,
                dueDate,
                principal: principalAmount,
                interest: interestAmount,
                totalDue: principalAmount.plus(interestAmount),
                balance: balance.greaterThan(0) ? balance : new Decimal(0)
            })

            currentDate = dueDate
        }

        return installments
    }

    /**
     * Get Overdue Installments
     * 
     * Helper to identify which installments should be paid first.
     * Used by repayment allocation logic.
     */
    static getOverdueInstallments(
        schedule: ScheduleInstallment[],
        asOfDate: Date = new Date()
    ): ScheduleInstallment[] {
        return schedule.filter(inst => inst.dueDate <= asOfDate)
    }

    /**
     * Calculate Total Expected Payment
     * 
     * Sum of all principal + interest in the schedule.
     */
    static calculateTotalExpectedPayment(
        schedule: ScheduleInstallment[]
    ): Decimal {
        return schedule.reduce(
            (total, inst) => total.plus(inst.principal).plus(inst.interest),
            new Decimal(0)
        )
    }
}
