'use server'

import { db } from '@/lib/db'
import { LoanScheduleCache } from '@/lib/services/LoanScheduleCache'

export type EligibilityResult = {
    isEligible: boolean
    totalArrears: number
    message?: string
    breakdown?: {
        loanNumber: string
        arrears: number
    }[]
}

/**
 * STRICT ELIGIBILITY GUARD
 * Checks if a member has ANY outstanding arrears on ACTIVE loans.
 */
export async function checkLoanEligibility(memberId: string): Promise<EligibilityResult> {
    try {
        let totalArrears = 0
        const breakdown: { loanNumber: string, arrears: number }[] = []

        // 1. Check Member Contribution & Penalty Arrears
        const member = await db.member.findUnique({
            where: { id: memberId },
            select: { contributionArrears: true, penaltyArrears: true }
        })

        if (member) {
            const contributionArrears = Number(member.contributionArrears || 0)
            const penaltyArrears = Number(member.penaltyArrears || 0)
            const memberArrears = contributionArrears + penaltyArrears

            if (memberArrears > 0) {
                totalArrears += memberArrears
                breakdown.push({
                    loanNumber: 'Monthly Contributions & Penalties',
                    arrears: memberArrears
                })
            }
        }

        // 2. Fetch Active Loans
        const activeLoans = await db.loan.findMany({
            where: {
                memberId,
                status: { in: ['ACTIVE', 'OVERDUE'] }
            },
            include: {
                repaymentInstallments: {
                    orderBy: { dueDate: 'asc' }
                }
            }
        })

        if (activeLoans.length === 0 && totalArrears === 0) {
            return { isEligible: true, totalArrears: 0 }
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // 2. Iterate and Calculate Arrears per Loan
        for (const loan of activeLoans) {
            let schedule: any[] = []

            // Strategy: Use DB Schedule > Cache > Generate
            if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
                schedule = loan.repaymentInstallments
            } else if (loan.cachedSchedule) {
                schedule = loan.cachedSchedule as any[]
            } else if (loan.repaymentSchedule) {
                schedule = loan.repaymentSchedule as any[]
            } else {
                // Last resort: Generate
                schedule = await LoanScheduleCache.generateAndSaveSchedule(loan.id)
            }

            // Calculate Arrears: Sum of (Principal + Interest) where DueDate < Today AND !isPaid
            const overdueItems = schedule.filter((i: any) => {
                const d = new Date(i.dueDate || i.date)
                // Strict: Due date MUST be strictly before today to be "Arrears"
                return d < today && !i.isFullyPaid
            })

            const principalArrears = overdueItems.reduce((sum: number, i: any) => sum + Number(i.principalDue || i.principal || 0), 0)
            const interestArrears = overdueItems.reduce((sum: number, i: any) => sum + Number(i.interestDue || i.interest || 0), 0)
            const penaltyArrears = Number(loan.penalties || 0) // Penalties are always "Arrears" if unpaid

            const loanArrears = principalArrears + interestArrears + penaltyArrears

            if (loanArrears > 0) {
                totalArrears += loanArrears
                breakdown.push({
                    loanNumber: loan.loanApplicationNumber,
                    arrears: loanArrears
                })
            }
        }

        // 3. Final Decision
        if (totalArrears > 0) {
            return {
                isEligible: false,
                totalArrears,
                message: `Application Denied: You have outstanding arrears of KES ${totalArrears.toLocaleString()}. Please clear these before applying for a new loan.`,
                breakdown
            }
        }

        return { isEligible: true, totalArrears: 0 }

    } catch (error) {
        // Default to "Blocked" on system error to be safe, or allow? 
        // Safer to block and ask to contact admin.
        return {
            isEligible: false,
            totalArrears: 0,
            message: 'System Error: Could not verify eligibility. Please contact support.'
        }
    }
}
