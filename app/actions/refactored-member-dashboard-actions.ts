/**
 * Refactored Member Dashboard Actions
 * 
 * Uses new loan management services for accurate, consistent calculations
 */

'use server'

import { db } from '@/lib/db'
import { MonthlyDueService } from '@/lib/services/MonthlyDueService'
import { LoanBalanceService } from '@/lib/services/LoanBalanceService'
import { LoanStateService } from '@/lib/services/LoanStateService'

export interface RefactoredLoanPortfolioItem {
    id: string
    loanNumber: string
    productName: string
    amount: number
    balance: number
    status: string
    date: Date | null

    // Detailed breakdown
    arrears: number
    expectedAmount: number
    nextExpectedDate: Date | null

    // Additional info
    daysOverdue: number
    completionPercentage: number
}

/**
 * Get loan portfolio using new services
 */
export async function getRefactoredLoanPortfolio(memberId: string): Promise<RefactoredLoanPortfolioItem[]> {
    const loans = await db.loan.findMany({
        where: {
            memberId,
            status: {
                in: ['ACTIVE', 'OVERDUE', 'CLEARED']
            }
        },
        include: {
            loanProduct: true,
            repaymentInstallments: {
                take: 1 // Just to check if they exist
            }
        },
        orderBy: { applicationDate: 'desc' }
    })

    const portfolioItems: RefactoredLoanPortfolioItem[] = []

    for (const loan of loans) {
        try {
            // Check if loan has installments
            const hasInstallments = loan.repaymentInstallments && loan.repaymentInstallments.length > 0

            if (!hasInstallments) {
                // Fallback to old calculation for loans without installments
                portfolioItems.push({
                    id: loan.id,
                    loanNumber: loan.loanApplicationNumber || loan.id.substring(0, 8),
                    productName: loan.loanProduct?.name || 'Unknown',
                    amount: Number(loan.amount),
                    balance: 0, // Would need old calculation
                    status: loan.status,
                    date: loan.disbursementDate || loan.applicationDate,
                    arrears: 0,
                    expectedAmount: 0,
                    nextExpectedDate: null,
                    daysOverdue: 0,
                    completionPercentage: 0
                })
                continue
            }

            // Use new services
            const dueBreakdown = await MonthlyDueService.getDueBreakdown(loan.id)
            const balance = await LoanBalanceService.getLoanBalance(loan.id)
            const lifecycle = await LoanStateService.getLoanLifecycleSummary(loan.id)

            portfolioItems.push({
                id: loan.id,
                loanNumber: loan.loanApplicationNumber || loan.id.substring(0, 8),
                productName: loan.loanProduct?.name || 'Unknown',
                amount: Number(loan.amount),
                balance: balance.totals.totalOutstanding,
                status: loan.status,
                date: loan.disbursementDate || loan.applicationDate,

                arrears: dueBreakdown.arrears.total,
                expectedAmount: dueBreakdown.totalDue,
                nextExpectedDate: dueBreakdown.current.dueDate,

                daysOverdue: lifecycle.daysOverdue,
                completionPercentage: lifecycle.completionPercentage
            })

        } catch (error) {
            // Include loan with zero values on error
            portfolioItems.push({
                id: loan.id,
                loanNumber: loan.loanApplicationNumber || loan.id.substring(0, 8),
                productName: loan.loanProduct?.name || 'Unknown',
                amount: Number(loan.amount),
                balance: 0,
                status: loan.status,
                date: loan.disbursementDate || loan.applicationDate,
                arrears: 0,
                expectedAmount: 0,
                nextExpectedDate: null,
                daysOverdue: 0,
                completionPercentage: 0
            })
        }
    }

    return portfolioItems
}

/**
 * Get member portfolio summary using new services
 */
export async function getRefactoredMemberPortfolio(memberId: string) {
    try {
        const portfolio = await LoanBalanceService.getMemberPortfolioBalance(memberId)

        return {
            success: true,
            data: portfolio
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
}
