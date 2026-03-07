import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Phase 4: Overpayment Handler Service
 * 
 * Manages scenarios where payments exceed the scheduled amounts.
 * 
 * Strategies:
 * 1. Apply to Future Principal (default) - Reduces future interest
 * 2. Hold as Credit Balance - For member's next payment
 * 3. Refund - Return excess to member (manual process)
 */
export class OverpaymentHandlerService {

    /**
     * Detect overpayment on a loan
     * 
     * @param loanId - The loan to check
     * @returns Overpayment amount and details
     */
    static async detectOverpayment(loanId: string): Promise<{
        hasOverpayment: boolean
        overpaymentAmount: number
        totalPaid: number
        totalDue: number
    }> {

        // Fetch all installments
        const installments = await db.repaymentInstallment.findMany({
            where: { loanId }
        })

        // Calculate total scheduled vs total paid
        let totalDue = 0
        let totalPaid = 0

        for (const inst of installments) {
            totalDue += Number(inst.principalDue) + Number(inst.interestDue) +
                Number(inst.penaltyDue) + Number(inst.feeDue)

            totalPaid += Number(inst.principalPaid) + Number(inst.interestPaid) +
                Number(inst.penaltyPaid) + Number(inst.feesPaid)
        }

        const overpaymentAmount = Math.max(0, totalPaid - totalDue)

        return {
            hasOverpayment: overpaymentAmount > 0,
            overpaymentAmount,
            totalPaid,
            totalDue
        }
    }

    /**
     * Apply overpayment to future principal (reduces future interest)
     * 
     * Strategy: Distribute excess across future installments' principal
     * This reduces the outstanding balance and therefore future interest charges
     * 
     * @param loanId - The loan with overpayment
     * @param overpaymentAmount - Amount to apply
     */
    static async applyToFuturePrincipal(
        loanId: string,
        overpaymentAmount: number
    ): Promise<{ installmentsAffected: number }> {

        if (overpaymentAmount <= 0) {
            throw new Error('Overpayment amount must be greater than zero')
        }

        return await db.$transaction(async (tx) => {
            // Fetch future unpaid installments (ordered by due date)
            const futureInstallments = await tx.repaymentInstallment.findMany({
                where: {
                    loanId,
                    isFullyPaid: false,
                    dueDate: { gte: new Date() }
                },
                orderBy: { dueDate: 'asc' }
            })

            if (futureInstallments.length === 0) {
                // No future installments - loan might be fully paid
                // Could create a credit balance record here
                return { installmentsAffected: 0 }
            }

            let remainingOverpayment = overpaymentAmount
            let installmentsAffected = 0

            // Distribute overpayment across future installments
            for (const inst of futureInstallments) {
                if (remainingOverpayment <= 0) break

                const principalRemaining = Number(inst.principalDue) - Number(inst.principalPaid)
                const amountToApply = Math.min(remainingOverpayment, principalRemaining)

                if (amountToApply > 0) {
                    const newPrincipalPaid = Number(inst.principalPaid) + amountToApply

                    // Check if this makes the installment fully paid
                    const isFullyPaid =
                        newPrincipalPaid >= Number(inst.principalDue) &&
                        Number(inst.interestPaid) >= Number(inst.interestDue) &&
                        Number(inst.penaltyPaid) >= Number(inst.penaltyDue) &&
                        Number(inst.feesPaid) >= Number(inst.feeDue)

                    await tx.repaymentInstallment.update({
                        where: { id: inst.id },
                        data: {
                            principalPaid: new Prisma.Decimal(newPrincipalPaid),
                            isFullyPaid
                        }
                    })

                    remainingOverpayment -= amountToApply
                    installmentsAffected++
                }
            }

            // If there's still remaining overpayment, it means the loan is overpaid
            // beyond all scheduled installments. This could trigger:
            // 1. Early loan closure
            // 2. Credit balance for member
            // 3. Refund process
            if (remainingOverpayment > 0) {
                // TODO: Implement credit balance tracking or early closure logic
            }

            return { installmentsAffected }
        })
    }

    /**
     * Calculate the impact of overpayment on future interest
     * 
     * This is informational - shows member how much interest they'll save
     * 
     * @param loanId - The loan to analyze
     * @param overpaymentAmount - Hypothetical overpayment amount
     */
    static async calculateInterestSavings(
        loanId: string,
        overpaymentAmount: number
    ): Promise<{
        currentTotalInterest: number
        projectedTotalInterest: number
        interestSavings: number
    }> {

        const installments = await db.repaymentInstallment.findMany({
            where: { loanId },
            orderBy: { dueDate: 'asc' }
        })

        // Current total interest (what's scheduled)
        const currentTotalInterest = installments.reduce(
            (sum, inst) => sum + Number(inst.interestDue),
            0
        )

        // For FLAT rate loans, interest doesn't change with early payment
        // For DECLINING_BALANCE, we'd need to recalculate based on reduced principal
        // This is a simplified calculation - real implementation would check loan type

        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: { loanProduct: true }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        let interestSavings = 0

        if (loan.loanProduct?.interestType === 'DECLINING_BALANCE') {
            // Simplified: Assume linear reduction
            // Real calculation would use the loan calculator with reduced principal
            const totalPrincipal = installments.reduce(
                (sum, inst) => sum + Number(inst.principalDue),
                0
            )

            const reductionRatio = overpaymentAmount / totalPrincipal
            interestSavings = currentTotalInterest * reductionRatio * 0.5 // Approximate
        }

        return {
            currentTotalInterest,
            projectedTotalInterest: currentTotalInterest - interestSavings,
            interestSavings
        }
    }

    /**
     * Handle full loan prepayment
     * 
     * @param loanId - The loan being prepaid
     * @param paymentAmount - The prepayment amount
     */
    static async handlePrepayment(
        loanId: string,
        paymentAmount: number
    ): Promise<{
        amountApplied: number
        overpaymentRefund: number
        loanClosed: boolean
    }> {

        return await db.$transaction(async (tx) => {
            // Calculate total outstanding
            const installments = await tx.repaymentInstallment.findMany({
                where: { loanId, isFullyPaid: false }
            })

            let totalOutstanding = 0
            for (const inst of installments) {
                totalOutstanding +=
                    (Number(inst.principalDue) - Number(inst.principalPaid)) +
                    (Number(inst.interestDue) - Number(inst.interestPaid)) +
                    (Number(inst.penaltyDue) - Number(inst.penaltyPaid)) +
                    (Number(inst.feeDue) - Number(inst.feesPaid))
            }

            const amountApplied = Math.min(paymentAmount, totalOutstanding)
            const overpaymentRefund = Math.max(0, paymentAmount - totalOutstanding)

            // Mark all installments as fully paid
            for (const inst of installments) {
                await tx.repaymentInstallment.update({
                    where: { id: inst.id },
                    data: {
                        principalPaid: inst.principalDue,
                        interestPaid: inst.interestDue,
                        penaltyPaid: inst.penaltyDue,
                        feesPaid: inst.feeDue,
                        isFullyPaid: true
                    }
                })
            }

            // Update loan status to CLEARED
            await tx.loan.update({
                where: { id: loanId },
                data: { status: 'CLEARED' }
            })

            return {
                amountApplied,
                overpaymentRefund,
                loanClosed: true
            }
        })
    }
}
