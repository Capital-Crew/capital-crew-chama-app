import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface RepaymentAllocation {
    penaltyAmount: number
    interestAmount: number
    principalAmount: number
    feeAmount: number
    totalAllocated: number
    overpayment: number
}

/**
 * Phase 3: Repayment Processing Engine
 * Implements "Waterfall" allocation strategy: Penalty -> Interest -> Principal
 * 
 * This service processes incoming payments by:
 * 1. Fetching unpaid installments (oldest first)
 * 2. Allocating payment according to priority rules
 * 3. Updating installment paid amounts
 * 4. Creating an auditable LoanTransaction record
 */
export class RepaymentProcessorService {

    /**
     * Process a repayment transaction using Waterfall allocation
     * 
     * @param loanId - The loan receiving the payment
     * @param amount - Total payment amount
     * @param paymentDate - When the payment was made
     * @param description - Payment description/reference
     * @returns The created LoanTransaction with allocation breakdown
     */
    static async processRepayment(
        loanId: string,
        amount: number,
        paymentDate: Date = new Date(),
        description: string = 'Loan Repayment'
    ): Promise<{ transaction: any; allocation: RepaymentAllocation }> {

        if (amount <= 0) {
            throw new Error('Payment amount must be greater than zero')
        }

        return await db.$transaction(async (tx) => {
            // 1. Fetch all unpaid installments (oldest first)
            const installments = await tx.repaymentInstallment.findMany({
                where: {
                    loanId,
                    isFullyPaid: false
                },
                orderBy: { dueDate: 'asc' }
            })

            if (installments.length === 0) {
                throw new Error('No unpaid installments found for this loan')
            }

            // 2. Initialize allocation tracking
            let remainingAmount = amount
            const allocation: RepaymentAllocation = {
                penaltyAmount: 0,
                interestAmount: 0,
                principalAmount: 0,
                feeAmount: 0,
                totalAllocated: 0,
                overpayment: 0
            }

            // 3. Apply Waterfall Logic to each installment
            for (const inst of installments) {
                if (remainingAmount <= 0) break

                // Calculate what's still owed on this installment
                const penaltyOwed = Number(inst.penaltyDue) - Number(inst.penaltyPaid)
                const feeOwed = Number(inst.feeDue) - Number(inst.feesPaid)
                const interestOwed = Number(inst.interestDue) - Number(inst.interestPaid)
                const principalOwed = Number(inst.principalDue) - Number(inst.principalPaid)

                // PRIORITY 1: Penalties
                const penaltyPayment = Math.min(remainingAmount, penaltyOwed)
                allocation.penaltyAmount += penaltyPayment
                remainingAmount -= penaltyPayment

                // PRIORITY 2: Fees (if any)
                const feePayment = Math.min(remainingAmount, feeOwed)
                allocation.feeAmount += feePayment
                remainingAmount -= feePayment

                // PRIORITY 3: Interest
                const interestPayment = Math.min(remainingAmount, interestOwed)
                allocation.interestAmount += interestPayment
                remainingAmount -= interestPayment

                // PRIORITY 4: Principal
                const principalPayment = Math.min(remainingAmount, principalOwed)
                allocation.principalAmount += principalPayment
                remainingAmount -= principalPayment

                // Update the installment with new paid amounts
                const newPenaltyPaid = Number(inst.penaltyPaid) + penaltyPayment
                const newFeesPaid = Number(inst.feesPaid) + feePayment
                const newInterestPaid = Number(inst.interestPaid) + interestPayment
                const newPrincipalPaid = Number(inst.principalPaid) + principalPayment

                // Check if installment is now fully paid
                const isFullyPaid =
                    newPenaltyPaid >= Number(inst.penaltyDue) &&
                    newFeesPaid >= Number(inst.feeDue) &&
                    newInterestPaid >= Number(inst.interestDue) &&
                    newPrincipalPaid >= Number(inst.principalDue)

                // Persist the update
                await tx.repaymentInstallment.update({
                    where: { id: inst.id },
                    data: {
                        penaltyPaid: new Prisma.Decimal(newPenaltyPaid),
                        feesPaid: new Prisma.Decimal(newFeesPaid),
                        interestPaid: new Prisma.Decimal(newInterestPaid),
                        principalPaid: new Prisma.Decimal(newPrincipalPaid),
                        isFullyPaid
                    }
                })
            }

            // 4. Handle any overpayment (Phase 4 preview)
            allocation.overpayment = remainingAmount
            allocation.totalAllocated = amount - remainingAmount

            // If there's overpayment, add it to principal (reduces future interest)
            if (allocation.overpayment > 0) {
                allocation.principalAmount += allocation.overpayment
                allocation.totalAllocated = amount
            }

            // 5. Create the LoanTransaction record for audit trail
            const transaction = await tx.loanTransaction.create({
                data: {
                    loanId,
                    type: 'REPAYMENT',
                    amount: new Prisma.Decimal(amount),
                    principalAmount: new Prisma.Decimal(allocation.principalAmount),
                    interestAmount: new Prisma.Decimal(allocation.interestAmount),
                    penaltyAmount: new Prisma.Decimal(allocation.penaltyAmount),
                    feeAmount: new Prisma.Decimal(allocation.feeAmount),
                    description,
                    postedAt: paymentDate
                }
            })

            return { transaction, allocation }
        })
    }

    /**
     * Reverse a repayment transaction (for corrections/backdating scenarios)
     * Phase 4: This would trigger a full transaction replay
     */
    static async reverseRepayment(transactionId: string): Promise<void> {
        // TODO: Phase 4 - Implement TransactionReplayService integration
        throw new Error('Reversal not yet implemented - requires TransactionReplayService')
    }
}
