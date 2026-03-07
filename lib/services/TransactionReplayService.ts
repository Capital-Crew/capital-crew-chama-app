
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
            // 1. Fetch all installments for this loan (ONCE)
            const allInstallments = await prisma.repaymentInstallment.findMany({
                where: { loanId },
                orderBy: { dueDate: 'asc' }
            })

            // If no installments, we can't replay against schedule.
            if (allInstallments.length === 0) {
                // If there are transactions but no installments, we might have a data integrity issue, 
                // but we can't do anything here.
                return { installmentsUpdated: 0, transactionsReplayed: 0 }
            }

            // 2. Initialize In-Memory Installment State
            // We map them to a mutable structure to track paid amounts during the replay
            // If fromDate is provided, we technically only need to reset those after fromDate,
            // BUT to be safe and simple (and since we need to know the state of previous ones to know where to apply payment),
            // we usually replay EVERYTHING from the start, OR we assume previous ones are correct.
            // However, "Waterfalling" implies if I overpaid previous, it spills to next.
            // If we start from middle, we assume "remaining balance" is correct?
            // Safer approach: Reset EVERYTHING if possible, or Reset from Date.
            // If we only "replay" from Date, we must ensure we don't zero out previous history if we aren't re-processing previous transactions.

            // To support `fromDate` correctly without re-fetching all history, we would need the cumulative "carry over" from previous.
            // But usually `replayTransactions` is called with undefined `fromDate` for full consistency.
            // If `fromDate` is used, we assume previous structure is frozen.

            let installmentsState = allInstallments.map(inst => {
                // Should we reset?
                // If we are replaying from a specific date, we only reset installments that are AFTER that date (or potentially affected).
                const shouldReset = !fromDate || new Date(inst.dueDate) >= fromDate

                return {
                    id: inst.id,
                    dueDate: inst.dueDate,
                    principalDue: Number(inst.principalDue),
                    interestDue: Number(inst.interestDue),
                    penaltyDue: Number(inst.penaltyDue),
                    feeDue: Number(inst.feeDue),
                    // Mutable Paid Fields
                    principalPaid: shouldReset ? 0 : Number(inst.principalPaid),
                    interestPaid: shouldReset ? 0 : Number(inst.interestPaid),
                    penaltyPaid: shouldReset ? 0 : Number(inst.penaltyPaid),
                    feesPaid: shouldReset ? 0 : Number(inst.feesPaid),
                    isFullyPaid: shouldReset ? false : inst.isFullyPaid,
                    wasModified: shouldReset // Track if we need to write this back
                }
            })

            // 3. Fetch REPAYMENT transactions
            const transactions = await prisma.loanTransaction.findMany({
                where: {
                    loanId,
                    type: 'REPAYMENT',
                    isReversed: false,
                    ...(fromDate && { postedAt: { gte: fromDate } })
                },
                orderBy: { postedAt: 'asc' }
            })

            // 4. In-Memory Waterfall Application
            let transactionsReplayed = 0

            for (const txn of transactions) {
                const amount = Number(txn.amount)
                let remainingAmount = amount

                // Track allocation for this transaction to update the transaction record itself
                let allocPrincipal = 0
                let allocInterest = 0
                let allocPenalty = 0
                let allocFees = 0

                // Iterate through in-memory installments (only those not fully paid)
                // We use a simplified loop or strict waterfall
                for (const inst of installmentsState) {
                    if (remainingAmount <= 0) break
                    if (inst.isFullyPaid) continue

                    const penaltyOwed = inst.penaltyDue - inst.penaltyPaid
                    const feeOwed = inst.feeDue - inst.feesPaid
                    const interestOwed = inst.interestDue - inst.interestPaid
                    const principalOwed = inst.principalDue - inst.principalPaid

                    // 1. Penalty
                    const penaltyPayment = Math.min(remainingAmount, penaltyOwed)
                    if (penaltyPayment > 0) {
                        remainingAmount -= penaltyPayment
                        allocPenalty += penaltyPayment
                        inst.penaltyPaid += penaltyPayment
                        inst.wasModified = true
                    }

                    // 2. Fees
                    const feePayment = Math.min(remainingAmount, feeOwed)
                    if (feePayment > 0) {
                        remainingAmount -= feePayment
                        allocFees += feePayment
                        inst.feesPaid += feePayment
                        inst.wasModified = true
                    }

                    // 3. Interest
                    const interestPayment = Math.min(remainingAmount, interestOwed)
                    if (interestPayment > 0) {
                        remainingAmount -= interestPayment
                        allocInterest += interestPayment
                        inst.interestPaid += interestPayment
                        inst.wasModified = true
                    }

                    // 4. Principal
                    const principalPayment = Math.min(remainingAmount, principalOwed)
                    if (principalPayment > 0) {
                        remainingAmount -= principalPayment
                        allocPrincipal += principalPayment
                        inst.principalPaid += principalPayment
                        inst.wasModified = true
                    }

                    // Check Fully Paid
                    // Floating point tolerance
                    const TOLERANCE = 0.01
                    const totalDue = inst.penaltyDue + inst.feeDue + inst.interestDue + inst.principalDue
                    const totalPaid = inst.penaltyPaid + inst.feesPaid + inst.interestPaid + inst.principalPaid

                    if (totalPaid >= totalDue - TOLERANCE) {
                        inst.isFullyPaid = true
                        inst.wasModified = true
                    }
                }

                // 5. Update Transaction Record (One Query per Tx)
                // Only if allocation changed? Or always safety? 
                // Always safety to ensure consistency.
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

            // 6. Bulk Update Installments
            // We only update those that were modified/reset
            const modifiedInstallments = installmentsState.filter(i => i.wasModified)

            // Prisma doesn't support bulk update with different values easily.
            // So we use Promise.all with individual updates.
            // This is still much faster than doing it inside the transaction loop.
            await Promise.all(modifiedInstallments.map(inst =>
                prisma.repaymentInstallment.update({
                    where: { id: inst.id },
                    data: {
                        principalPaid: new Prisma.Decimal(inst.principalPaid),
                        interestPaid: new Prisma.Decimal(inst.interestPaid),
                        penaltyPaid: new Prisma.Decimal(inst.penaltyPaid),
                        feesPaid: new Prisma.Decimal(inst.feesPaid),
                        isFullyPaid: inst.isFullyPaid
                    }
                })
            ))

            // 7. Update Loan Outstanding Balance
            // Logic: Total Due in Schedule - Total Paid in Schedule
            let totalDue = new Prisma.Decimal(0)
            let totalPaid = new Prisma.Decimal(0)

            // We can use the in-memory state for this sum!
            for (const inst of installmentsState) {
                totalDue = totalDue.add(inst.principalDue).add(inst.interestDue).add(inst.penaltyDue).add(inst.feeDue)
                totalPaid = totalPaid.add(inst.principalPaid).add(inst.interestPaid).add(inst.penaltyPaid).add(inst.feesPaid)
            }

            const outstandingBalance = totalDue.sub(totalPaid)

            await prisma.loan.update({
                where: { id: loanId },
                data: { outstandingBalance }
            })

            return {
                installmentsUpdated: modifiedInstallments.length,
                transactionsReplayed
            }
        }

        // Use provided transaction or create a new one
        if (tx) {
            return await performReplay(tx)
        } else {
            return await db.$transaction(async (prisma) => {
                return await performReplay(prisma)
            }, {
                maxWait: 5000,
                timeout: 20000
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
