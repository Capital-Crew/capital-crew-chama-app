'use server'

import { db as prisma } from '@/lib/db'
import { generateRepaymentSchedule } from '@/lib/loan-calculator'
import type { LoanScheduleResult } from '@/lib/services/loanCalculator'

/**
 * Get loan payment schedule for a specific loan.
 * Uses the MONTHLY-rate calculator so the UI matches the DB schedule exactly.
 * loan.interestRate is stored as a monthly percentage (e.g. 2 = 2% per month).
 */
export async function getLoanSchedule(loanId: string): Promise<LoanScheduleResult | null> {
    try {
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { loanProduct: true, member: true }
        })

        if (!loan) throw new Error('Loan not found')

        const principal    = Number(loan.amount)
        const monthlyRate  = Number(loan.interestRate)   // already per month (e.g. 2 for 2%)
        const durationMonths = loan.installments || loan.loanProduct.numberOfRepayments
        const startDate    = loan.disbursementDate || new Date()
        const amortType    = (loan.loanProduct.amortizationType as any) || 'EQUAL_INSTALLMENTS'
        const interestType = (loan.loanProduct.interestType as 'FLAT' | 'DECLINING_BALANCE') || 'DECLINING_BALANCE'

        // Generate using the monthly-rate-aware calculator with product's interest method
        const rawSchedule = generateRepaymentSchedule(
            {
                principal,
                interestRatePerMonth: monthlyRate,
                installments: durationMonths,
                amortizationType: amortType,
                interestType
            },
            startDate
        )

        // Map to the LoanScheduleResult shape that LoanScheduleView expects
        const schedule = rawSchedule.map(item => ({
            monthNo:          item.installmentNumber,
            date:             item.dueDate,
            principalPayment: item.principalDue,
            interestPayment:  item.interestDue,
            totalPayment:     item.totalDue,
            remainingBalance: item.balance,
        }))

        const totalInterest = schedule.reduce((s, i) => s + i.interestPayment, 0)
        const totalPayable  = principal + totalInterest

        return {
            summary: {
                monthlyPaymentAmount: schedule[0]?.totalPayment ?? 0,
                totalInterest,
                totalPayable,
            },
            schedule,
        }
    } catch (error) {
        return null
    }
}

/**
 * Get loan schedule for display (with loan details)
 * Returns both loan info and calculated schedule
 */
export async function getLoanWithSchedule(loanId: string) {
    try {
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                loanProduct: true,
                member: true
            }
        })

        if (!loan) {
            return null
        }

        const schedule = await getLoanSchedule(loanId)

        return {
            loan: {
                id: loan.id,
                loanApplicationNumber: loan.loanApplicationNumber,
                memberName: loan.member.name,
                amount: loan.amount,
                interestRate: loan.interestRate,
                status: loan.status,
                disbursementDate: loan.disbursementDate,
                productName: loan.loanProduct.name,
                interestType: loan.loanProduct.interestType,
                durationMonths: loan.loanProduct.numberOfRepayments
            },
            schedule
        }
    } catch (error) {
        return null
    }
}
