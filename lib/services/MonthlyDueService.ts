import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface DueBreakdown {
    arrears: {
        principal: number
        interest: number
        penalty: number
        total: number
    }
    current: {
        principal: number
        interest: number
        total: number
        dueDate: Date | null
    }
    totalDue: number
    isOverdue: boolean
}

/**
 * Service to calculate what is CURRENTLY DUE for a loan based on the Database State.
 * This is the "Truth" for Dashboards and Repayment Processing.
 */
export class MonthlyDueService {

    static async getDueBreakdown(loanId: string, asOfDate: Date = new Date()): Promise<DueBreakdown> {
        const today = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate())

        // Fetch all installments that are EITHER overdue OR due today
        // AND are not fully paid
        const installments = await db.repaymentInstallment.findMany({
            where: {
                loanId,
                isFullyPaid: false,
                dueDate: { lte: asOfDate } // Use strict Date comparison if possible
            },
            orderBy: { dueDate: 'asc' }
        })

        const breakdown: DueBreakdown = {
            arrears: { principal: 0, interest: 0, penalty: 0, total: 0 },
            current: { principal: 0, interest: 0, total: 0, dueDate: null },
            totalDue: 0,
            isOverdue: false
        }

        // Separate Overdue vs Current
        // Logic: Any installment with dueDate < Today is "Arrears"
        // Logic: Installment with dueDate == Today (or within current cycle depending on policy) is "Current"
        // Here we assume strict "Past Due Date" = Arrears.

        for (const inst of installments) {
            const dueDate = new Date(inst.dueDate)
            const isPastDue = dueDate < today

            // Calculate Remaining Due on this installment
            // (Due - Paid)
            const prinRem = Number(inst.principalDue) - Number(inst.principalPaid)
            const intRem = Number(inst.interestDue) - Number(inst.interestPaid)
            // Penalties are usually calculated dynamically or stored. 
            // If stored on installment, use penaltyPaid vs penaltyAmount (if tracked).
            const penRem = Number(inst.penaltyDue) - Number(inst.penaltyPaid)

            if (isPastDue) {
                breakdown.arrears.principal += Math.max(0, prinRem)
                breakdown.arrears.interest += Math.max(0, intRem)
                breakdown.arrears.penalty += Math.max(0, penRem)
            } else {
                // It is TODAY (or future if query was broader)
                breakdown.current.principal += Math.max(0, prinRem)
                breakdown.current.interest += Math.max(0, intRem)
                breakdown.current.dueDate = inst.dueDate
            }
        }

        breakdown.arrears.total = breakdown.arrears.principal + breakdown.arrears.interest + breakdown.arrears.penalty
        breakdown.current.total = breakdown.current.principal + breakdown.current.interest

        breakdown.totalDue = breakdown.arrears.total + breakdown.current.total
        breakdown.isOverdue = breakdown.arrears.total > 0

        return breakdown
    }
}
