import { db } from '@/lib/db'

/**
 * Phase 5: Loan State Service
 * 
 * Manages loan lifecycle transitions and status updates.
 * 
 * Loan States:
 * - PENDING: Application submitted, not yet approved
 * - APPROVED: Approved but not disbursed
 * - ACTIVE: Disbursed and being repaid
 * - OVERDUE: Has overdue installments
 * - CLEARED: Fully paid off
 * - WRITTEN_OFF: Bad debt
 */
export class LoanStateService {

    /**
     * Update loan status based on current installment state
     * 
     * This should be called after:
     * - Processing a repayment
     * - Running penalty accrual
     * - Manual status changes
     * 
     * @param loanId - The loan to update
     */
    static async updateLoanStatus(loanId: string): Promise<{
        previousStatus: string
        newStatus: string
        statusChanged: boolean
    }> {

        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: {
                repaymentInstallments: {
                    orderBy: { dueDate: 'asc' }
                }
            }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        const previousStatus = loan.status
        let newStatus = loan.status

        // Skip if loan is already in terminal state
        if (['CLEARED', 'WRITTEN_OFF', 'REJECTED'].includes(loan.status)) {
            return {
                previousStatus,
                newStatus,
                statusChanged: false
            }
        }

        const installments = loan.repaymentInstallments || []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check if all installments are fully paid
        const allPaid = installments.length > 0 &&
            installments.every(inst => inst.isFullyPaid)

        if (allPaid) {
            newStatus = 'CLEARED'
        } else {
            // Check for overdue installments
            const hasOverdue = installments.some(inst => {
                const dueDate = new Date(inst.dueDate)
                dueDate.setHours(0, 0, 0, 0)

                return !inst.isFullyPaid && dueDate < today
            })

            if (hasOverdue) {
                newStatus = 'OVERDUE'
            } else if (loan.status === 'OVERDUE') {
                // Was overdue but now current - return to ACTIVE
                newStatus = 'ACTIVE'
            }
        }

        // Update if status changed
        const statusChanged = newStatus !== previousStatus

        if (statusChanged) {
            await db.loan.update({
                where: { id: loanId },
                data: {
                    status: newStatus,
                    ...(newStatus === 'CLEARED' && {
                        lastPaymentDate: new Date()
                    })
                }
            })
        }

        return {
            previousStatus,
            newStatus,
            statusChanged
        }
    }

    /**
     * Transition loan to ACTIVE status (after disbursement)
     * 
     * @param loanId - The loan to activate
     * @param disbursementDate - When the loan was disbursed
     */
    static async activateLoan(
        loanId: string,
        disbursementDate: Date = new Date()
    ): Promise<void> {

        await db.loan.update({
            where: { id: loanId },
            data: {
                status: 'ACTIVE',
                disbursementDate,
                nextDueDate: await this.calculateNextDueDate(loanId)
            }
        })
    }

    /**
     * Mark loan as written off (bad debt)
     * 
     * @param loanId - The loan to write off
     * @param reason - Reason for write-off
     */
    static async writeOffLoan(
        loanId: string,
        reason: string
    ): Promise<void> {

        await db.loan.update({
            where: { id: loanId },
            data: {
                status: 'WRITTEN_OFF',
                // Could add a notes field or create a separate WriteOff record
            }
        })

        // TODO: Create accounting entries for write-off
        // - Debit: Bad Debt Expense
        // - Credit: Loan Portfolio
    }

    /**
     * Calculate the next due date for a loan
     * 
     * @param loanId - The loan to check
     * @returns The next unpaid installment's due date, or null if all paid
     */
    static async calculateNextDueDate(loanId: string): Promise<Date | null> {

        const nextInstallment = await db.repaymentInstallment.findFirst({
            where: {
                loanId,
                isFullyPaid: false
            },
            orderBy: { dueDate: 'asc' }
        })

        return nextInstallment ? nextInstallment.dueDate : null
    }

    /**
     * Get loan lifecycle summary
     * 
     * @param loanId - The loan to summarize
     */
    static async getLoanLifecycleSummary(loanId: string): Promise<{
        status: string
        daysActive: number
        daysSinceLastPayment: number | null
        daysOverdue: number
        completionPercentage: number
    }> {

        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: {
                repaymentInstallments: true,
                transactions: {
                    where: { type: 'REPAYMENT', isReversed: false },
                    orderBy: { postedAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        const today = new Date()

        // Days active
        const disbursementDate = loan.disbursementDate || loan.applicationDate
        const daysActive = disbursementDate
            ? Math.floor((today.getTime() - disbursementDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0

        // Days since last payment
        const lastPayment = loan.transactions?.[0]
        const daysSinceLastPayment = lastPayment
            ? Math.floor((today.getTime() - lastPayment.postedAt.getTime()) / (1000 * 60 * 60 * 24))
            : null

        // Days overdue (oldest unpaid installment)
        const oldestOverdue = loan.repaymentInstallments
            ?.filter(inst => !inst.isFullyPaid && new Date(inst.dueDate) < today)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

        const daysOverdue = oldestOverdue
            ? Math.floor((today.getTime() - new Date(oldestOverdue.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0

        // Completion percentage
        const totalInstallments = loan.repaymentInstallments?.length || 0
        const paidInstallments = loan.repaymentInstallments?.filter(inst => inst.isFullyPaid).length || 0
        const completionPercentage = totalInstallments > 0
            ? Math.round((paidInstallments / totalInstallments) * 100)
            : 0

        return {
            status: loan.status,
            daysActive,
            daysSinceLastPayment,
            daysOverdue,
            completionPercentage
        }
    }

    /**
     * Batch update all loan statuses
     * Useful for daily/nightly jobs
     * 
     * @returns Number of loans updated
     */
    static async batchUpdateAllLoanStatuses(): Promise<number> {

        const activeLoans = await db.loan.findMany({
            where: {
                status: { in: ['ACTIVE', 'OVERDUE'] }
            },
            select: { id: true }
        })

        let updatedCount = 0

        for (const loan of activeLoans) {
            const result = await this.updateLoanStatus(loan.id)
            if (result.statusChanged) {
                updatedCount++
            }
        }

        return updatedCount
    }
}
