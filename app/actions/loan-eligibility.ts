'use server'

import { db } from '@/lib/db'
import { LoanScheduleCache } from '@/lib/services/LoanScheduleCache'
import { MESSAGES } from '@/lib/constants/messages'

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
            
            const { getLoanPenaltyBalance } = await import('@/lib/accounting/AccountingEngine')
            const penaltyArrears = await getLoanPenaltyBalance(loan.id) // Penalties are always "Arrears" if unpaid

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
                message: MESSAGES.LOAN.ELIGIBILITY_ARREARS(totalArrears.toLocaleString()),
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
            message: MESSAGES.LOAN.ELIGIBILITY_ARREARS('0') // Generic eligibility fail
        }
    }
}

/**
 * CONCURRENT LOAN LIMIT CHECK
 * Checks if a member has reached the maximum allowed active loans for a given product type.
 * 
 * Rules:
 * - maxConcurrentLoans = 0 → unlimited (no cap)
 * - concurrentLimitActive = false → rule not enforced
 * - Active statuses: ACTIVE, APPROVED
 */
export async function checkConcurrentLoanLimit(
    memberId: string,
    loanProductId: string,
    excludeLoanId?: string
): Promise<{ allowed: boolean; message?: string; currentCount?: number; maxAllowed?: number }> {
    try {
        const product = await db.loanProduct.findUnique({
            where: { id: loanProductId },
            select: {
                name: true,
                maxConcurrentLoans: true,
                concurrentLimitActive: true,
            }
        })

        if (!product) {
            return { allowed: true } // Product not found — let downstream validation handle it
        }

        // Rule not enforced or unlimited
        if (!product.concurrentLimitActive || product.maxConcurrentLoans === 0) {
            return { allowed: true }
        }

        // Count member's active loans of this product type
        const activeCount = await db.loan.count({
            where: {
                memberId,
                loanProductId,
                status: { in: ['ACTIVE', 'APPROVED'] },
                ...(excludeLoanId ? { id: { not: excludeLoanId } } : {}),
            }
        })

        if (activeCount >= product.maxConcurrentLoans) {
            return {
                allowed: false,
                message: `Application Denied: You already have ${activeCount} active ${product.name} loan${activeCount !== 1 ? 's' : ''}. Maximum allowed: ${product.maxConcurrentLoans}.`,
                currentCount: activeCount,
                maxAllowed: product.maxConcurrentLoans,
            }
        }

        return { allowed: true, currentCount: activeCount, maxAllowed: product.maxConcurrentLoans }

    } catch (error) {
        // On error, allow the application to proceed — downstream checks will catch issues
        console.error('[ConcurrentLimitCheck] Error:', error)
        return { allowed: true }
    }
}
