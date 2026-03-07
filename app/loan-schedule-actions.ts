'use server'

import { db as prisma } from '@/lib/db'
import { calculateLoanSchedule, type LoanScheduleResult } from '@/lib/services/loanCalculator'

/**
 * Get loan payment schedule for a specific loan
 * Fetches loan and product data, then generates the amortization schedule
 */
export async function getLoanSchedule(loanId: string): Promise<LoanScheduleResult | null> {
    try {
        // Fetch loan with product details
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                loanProduct: true, // Need this for interestType and numberOfRepayments
                member: true
            }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        // Extract calculation parameters
        const principal = loan.amount
        const annualInterestRate = loan.interestRate
        const durationMonths = loan.installments || loan.loanProduct.numberOfRepayments
        const interestType = loan.loanProduct.interestType // FLAT or DECLINING_BALANCE
        const startDate = loan.disbursementDate || new Date()

        // Calculate schedule
        const schedule = calculateLoanSchedule({
            principal,
            annualInterestRate,
            durationMonths,
            interestType,
            startDate
        })

        return schedule
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
