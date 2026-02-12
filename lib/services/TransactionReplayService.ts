
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Phase 4: Transaction Replay Service
 * 
 * Handles scenarios where transactions need to be reprocessed:
 * - Back-dated payments
 * - Payment corrections
 * - Interest recalculation after early payments
 * 
 * This service ensures the installment state is always derivable from the transaction history.
 */
export class TransactionReplayService {

    /**
     * Replay all transactions for a loan to rebuild installment state
     * 
     * Use cases:
     * - After inserting a back-dated payment
     * - After correcting a transaction
     * - After changing loan terms (rare, but supported)
     * 
     * @param loanId - The loan to replay
     * @param fromDate - Optional: Only replay transactions from this date forward
     * @param tx - Optional: Existing transaction client to prevent nesting errors
     */
    static async replayTransactions(
        loanId: string,
        fromDate?: Date,
        tx?: Prisma.TransactionClient
    ): Promise<{ installmentsUpdated: number; transactionsReplayed: number }> {

        const performReplay = async (prisma: Prisma.TransactionClient) => {
            // 1. Fetch all installments for this loan
            const installments = await prisma.repaymentInstallment.findMany({
                where: { loanId },
                orderBy: { dueDate: 'asc' }
            })

            // If no installments, we can't replay against schedule.
            if (installments.length === 0) {
                console.warn(`No installments found for loan ${loanId} during replay.`)
                return { installmentsUpdated: 0, transactionsReplayed: 0 }
            }

            // 2. Reset installment state to "unpaid"
            // If fromDate is provided, only reset installments >= fromDate
            const installmentsToReset = fromDate
                ? installments.filter(i => new Date(i.dueDate) >= fromDate)
                : installments

            for (const inst of installmentsToReset) {
                await prisma.repaymentInstallment.update({
                    where: { id: inst.id },
                    data: {
                        principalPaid: new Prisma.Decimal(0),
                        interestPaid: new Prisma.Decimal(0),
                        penaltyPaid: new Prisma.Decimal(0),
                        feesPaid: new Prisma.Decimal(0),
                        isFullyPaid: false
                    }
                })
            }

            // 3. Fetch all REPAYMENT transactions (chronologically)
            const transactions = await prisma.loanTransaction.findMany({
                where: {
                    loanId,
                    type: 'REPAYMENT',
                    isReversed: false,
                    ...(fromDate && { postedAt: { gte: fromDate } })
                },
                orderBy: { postedAt: 'asc' }
            })

            // 4. Reapply each transaction using the same Waterfall logic
            let transactionsReplayed = 0

            for (const txn of transactions) {
                const amount = Number(txn.amount)
                let remainingAmount = amount

                // Track allocation for this transaction to update the transaction record itself
                let allocPrincipal = 0
                let allocInterest = 0
                let allocPenalty = 0
                let allocFees = 0

                // Fetch current state of installments (FRESH READ needed?)
                // Yes, because we updated them in loop.
                // OPTIMIZATION: operate on in-memory objects if possible, but reading DB is safer for consistency without complex state mgmt.
                const currentInstallments = await prisma.repaymentInstallment.findMany({
                    where: { loanId, isFullyPaid: false },
                    orderBy: { dueDate: 'asc' }
                })

                // Apply Waterfall allocation
                for (const inst of currentInstallments) {
                    if (remainingAmount <= 0) break

                    const penaltyOwed = Number(inst.penaltyDue) - Number(inst.penaltyPaid)
                    const feeOwed = Number(inst.feeDue) - Number(inst.feesPaid)
                    const interestOwed = Number(inst.interestDue) - Number(inst.interestPaid)
                    const principalOwed = Number(inst.principalDue) - Number(inst.principalPaid)

                    const penaltyPayment = Math.min(remainingAmount, penaltyOwed)
                    remainingAmount -= penaltyPayment
                    allocPenalty += penaltyPayment

                    const feePayment = Math.min(remainingAmount, feeOwed)
                    remainingAmount -= feePayment
                    allocFees += feePayment

                    const interestPayment = Math.min(remainingAmount, interestOwed)
                    remainingAmount -= interestPayment
                    allocInterest += interestPayment

                    const principalPayment = Math.min(remainingAmount, principalOwed)
                    remainingAmount -= principalPayment
                    allocPrincipal += principalPayment

                    // Update installment
                    const newPenaltyPaid = Number(inst.penaltyPaid) + penaltyPayment
                    const newFeesPaid = Number(inst.feesPaid) + feePayment
                    const newInterestPaid = Number(inst.interestPaid) + interestPayment
                    const newPrincipalPaid = Number(inst.principalPaid) + principalPayment

                    // Tolerance for floating point (though we casted to Number)
                    const TOLERANCE = 0.01

                    const isFullyPaid =
                        newPenaltyPaid >= Number(inst.penaltyDue) - TOLERANCE &&
                        newFeesPaid >= Number(inst.feeDue) - TOLERANCE &&
                        newInterestPaid >= Number(inst.interestDue) - TOLERANCE &&
                        newPrincipalPaid >= Number(inst.principalDue) - TOLERANCE

                    await prisma.repaymentInstallment.update({
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

                // Update Transaction Allocation Splits in the DB!
                // This ensures consistency between Schedule and Statement.
                await prisma.loanTransaction.update({
                    where: { id: txn.id },
                    data: {
                        principalAmount: new Prisma.Decimal(allocPrincipal),
                        interestAmount: new Prisma.Decimal(allocInterest),
                        penaltyAmount: new Prisma.Decimal(allocPenalty),
                        feeAmount: new Prisma.Decimal(allocFees)
                    }
                })

                transactionsReplayed++
            }

            return {
                installmentsUpdated: installmentsToReset.length,
                transactionsReplayed
            }
        }

        // Use provided transaction or create a new one
        if (tx) {
            return await performReplay(tx)
        } else {
            return await db.$transaction(async (prisma) => {
                return await performReplay(prisma)
            })
        }
    }

    /**
     * Insert a back-dated payment and replay subsequent transactions
     * 
     * @param loanId - The loan receiving the payment
     * @param amount - Payment amount
     * @param paymentDate - The historical date of the payment
     * @param description - Payment description
     */
    static async insertBackdatedPayment(
        loanId: string,
        amount: number,
        paymentDate: Date,
        description: string = 'Back-dated Payment'
    ): Promise<void> {

        return await db.$transaction(async (tx) => {
            // 1. Create the transaction record
            await tx.loanTransaction.create({
                data: {
                    loanId,
                    type: 'REPAYMENT',
                    amount: new Prisma.Decimal(amount),
                    description,
                    postedAt: paymentDate,
                    // Allocation will be calculated during replay
                    principalAmount: new Prisma.Decimal(0),
                    interestAmount: new Prisma.Decimal(0),
                    penaltyAmount: new Prisma.Decimal(0),
                    feeAmount: new Prisma.Decimal(0)
                }
            })

            // 2. Replay all transactions from this date forward
            // This ensures the back-dated payment is processed in chronological order
            // Pass 'tx' to ensure it sees the newly created transaction!
            await this.replayTransactions(loanId, paymentDate, tx)
        })
    }

    /**
     * Reverse a transaction and replay
     * 
     * @param transactionId - The transaction to reverse
     */
    static async reverseTransaction(transactionId: string): Promise<void> {

        return await db.$transaction(async (tx) => {
            // 1. Mark transaction as reversed
            const transaction = await tx.loanTransaction.update({
                where: { id: transactionId },
                data: { isReversed: true }
            })

            // 2. Replay from the transaction date
            // Pass 'tx' to ensure it sees the reversed state!
            await this.replayTransactions(transaction.loanId, transaction.postedAt, tx)
        })
    }
}
