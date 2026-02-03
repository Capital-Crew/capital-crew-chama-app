import { db } from '@/lib/db'

/**
 * Phase 5: Loan Balance Service
 * 
 * Maintains accurate running balances and aggregations.
 * All balances are derived from RepaymentInstallment state.
 */
export class LoanBalanceService {

    /**
     * Get comprehensive balance breakdown for a loan
     * 
     * @param loanId - The loan to query
     * @returns Detailed balance information
     */
    static async getLoanBalance(loanId: string): Promise<{
        principal: {
            original: number
            paid: number
            outstanding: number
        }
        interest: {
            scheduled: number
            paid: number
            outstanding: number
        }
        penalties: {
            accrued: number
            paid: number
            outstanding: number
        }
        fees: {
            accrued: number
            paid: number
            outstanding: number
        }
        totals: {
            totalScheduled: number
            totalPaid: number
            totalOutstanding: number
        }
    }> {

        const installments = await db.repaymentInstallment.findMany({
            where: { loanId }
        })

        if (installments.length === 0) {
            throw new Error('No installments found for this loan')
        }

        // Aggregate all amounts
        let principalDue = 0, principalPaid = 0
        let interestDue = 0, interestPaid = 0
        let penaltyDue = 0, penaltyPaid = 0
        let feeDue = 0, feesPaid = 0

        for (const inst of installments) {
            principalDue += Number(inst.principalDue)
            principalPaid += Number(inst.principalPaid)

            interestDue += Number(inst.interestDue)
            interestPaid += Number(inst.interestPaid)

            penaltyDue += Number(inst.penaltyDue)
            penaltyPaid += Number(inst.penaltyPaid)

            feeDue += Number(inst.feeDue)
            feesPaid += Number(inst.feesPaid)
        }



        // Fetch authoritative balance from Ledger
        // This includes all unbilled accruals, penalties, etc.
        const { getLoanOutstandingBalance } = await import('@/lib/accounting/AccountingEngine')
        const ledgerBalance = await getLoanOutstandingBalance(loanId)

        return {
            principal: {
                original: principalDue,
                paid: principalPaid,
                outstanding: principalDue - principalPaid
            },
            interest: {
                scheduled: interestDue,
                paid: interestPaid,
                outstanding: interestDue - interestPaid
            },
            penalties: {
                accrued: penaltyDue,
                paid: penaltyPaid,
                outstanding: penaltyDue - penaltyPaid
            },
            fees: {
                accrued: feeDue,
                paid: feesPaid,
                outstanding: feeDue - feesPaid
            },
            totals: {
                totalScheduled: principalDue + interestDue + penaltyDue + feeDue,
                totalPaid: principalPaid + interestPaid + penaltyPaid + feesPaid,
                // totalOutstanding: (principalDue - principalPaid) + ... // OLD: Installment based
                totalOutstanding: ledgerBalance // NEW: Ledger based
            }
        }
    }

    /**
     * Get arrears breakdown (overdue amounts)
     * 
     * @param loanId - The loan to check
     * @param asOfDate - Calculate arrears as of this date (default: today)
     */
    static async getArrearsBalance(
        loanId: string,
        asOfDate: Date = new Date()
    ): Promise<{
        principalArrears: number
        interestArrears: number
        penaltyArrears: number
        feeArrears: number
        totalArrears: number
        oldestOverdueDate: Date | null
        daysInArrears: number
    }> {

        const today = new Date(asOfDate)
        today.setHours(0, 0, 0, 0)

        const overdueInstallments = await db.repaymentInstallment.findMany({
            where: {
                loanId,
                isFullyPaid: false,
                dueDate: { lt: today }
            },
            orderBy: { dueDate: 'asc' }
        })

        let principalArrears = 0
        let interestArrears = 0
        let penaltyArrears = 0
        let feeArrears = 0

        for (const inst of overdueInstallments) {
            principalArrears += Number(inst.principalDue) - Number(inst.principalPaid)
            interestArrears += Number(inst.interestDue) - Number(inst.interestPaid)
            penaltyArrears += Number(inst.penaltyDue) - Number(inst.penaltyPaid)
            feeArrears += Number(inst.feeDue) - Number(inst.feesPaid)
        }

        const oldestOverdueDate = overdueInstallments[0]?.dueDate || null
        const daysInArrears = oldestOverdueDate
            ? Math.floor((today.getTime() - new Date(oldestOverdueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0

        return {
            principalArrears,
            interestArrears,
            penaltyArrears,
            feeArrears,
            totalArrears: principalArrears + interestArrears + penaltyArrears + feeArrears,
            oldestOverdueDate,
            daysInArrears
        }
    }

    /**
     * Get portfolio summary for a member (all their loans)
     * 
     * @param memberId - The member to query
     */
    static async getMemberPortfolioBalance(memberId: string): Promise<{
        activeLoans: number
        totalDisbursed: number
        totalOutstanding: number
        totalArrears: number
        totalPaid: number
    }> {

        const loans = await db.loan.findMany({
            where: {
                memberId,
                status: { in: ['ACTIVE', 'OVERDUE'] }
            },
            include: {
                repaymentInstallments: true
            }
        })

        let totalDisbursed = 0
        let totalOutstanding = 0
        let totalArrears = 0
        let totalPaid = 0

        for (const loan of loans) {
            // Get loan balance
            const balance = await this.getLoanBalance(loan.id)
            totalDisbursed += balance.principal.original
            totalOutstanding += balance.totals.totalOutstanding
            totalPaid += balance.totals.totalPaid

            // Get arrears
            const arrears = await this.getArrearsBalance(loan.id)
            totalArrears += arrears.totalArrears
        }

        return {
            activeLoans: loans.length,
            totalDisbursed,
            totalOutstanding,
            totalArrears,
            totalPaid
        }
    }

    /**
     * Calculate effective interest rate (actual vs scheduled)
     * Useful for reporting and member transparency
     * 
     * @param loanId - The loan to analyze
     */
    static async calculateEffectiveRate(loanId: string): Promise<{
        scheduledInterestRate: number
        effectiveInterestRate: number
        totalInterestPaid: number
        totalPrincipalPaid: number
    }> {

        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: {
                repaymentInstallments: true
            }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        const balance = await this.getLoanBalance(loanId)

        // Effective rate = (Total Interest Paid / Total Principal Paid) * 100
        // This is simplified - real calculation would consider time value
        const effectiveInterestRate = balance.principal.paid > 0
            ? (balance.interest.paid / balance.principal.paid) * 100
            : 0

        return {
            scheduledInterestRate: Number(loan.interestRate),
            effectiveInterestRate: Math.round(effectiveInterestRate * 100) / 100,
            totalInterestPaid: balance.interest.paid,
            totalPrincipalPaid: balance.principal.paid
        }
    }

    /**
     * Get payment history summary
     * 
     * @param loanId - The loan to query
     */
    static async getPaymentHistory(loanId: string): Promise<{
        totalPayments: number
        totalAmount: number
        averagePaymentAmount: number
        lastPaymentDate: Date | null
        lastPaymentAmount: number
        paymentFrequency: string
    }> {

        const transactions = await db.loanTransaction.findMany({
            where: {
                loanId,
                type: 'REPAYMENT',
                isReversed: false
            },
            orderBy: { postedAt: 'desc' }
        })

        const totalPayments = transactions.length
        const totalAmount = transactions.reduce((sum, txn) => sum + Number(txn.amount), 0)
        const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0

        const lastPayment = transactions[0]
        const lastPaymentDate = lastPayment?.postedAt || null
        const lastPaymentAmount = lastPayment ? Number(lastPayment.amount) : 0

        // Calculate payment frequency (simplified)
        let paymentFrequency = 'Unknown'
        if (transactions.length >= 2) {
            const daysBetween = Math.floor(
                (transactions[0].postedAt.getTime() - transactions[1].postedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )

            if (daysBetween <= 10) paymentFrequency = 'Weekly'
            else if (daysBetween <= 20) paymentFrequency = 'Bi-weekly'
            else if (daysBetween <= 35) paymentFrequency = 'Monthly'
            else paymentFrequency = 'Irregular'
        }

        return {
            totalPayments,
            totalAmount,
            averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
            lastPaymentDate,
            lastPaymentAmount,
            paymentFrequency
        }
    }
}
