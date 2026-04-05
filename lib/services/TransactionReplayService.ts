
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
            const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')

            // 1. Fetch all installments for this loan (ONCE)
            const allInstallments = await prisma.repaymentInstallment.findMany({
                where: { loanId },
                orderBy: { dueDate: 'asc' }
            })

            if (allInstallments.length === 0) {
                return { installmentsUpdated: 0, transactionsReplayed: 0 }
            }

            let installmentsState = allInstallments.map(inst => {
                const shouldReset = !fromDate || new Date(inst.dueDate) >= fromDate

                return {
                    id: inst.id,
                    dueDate: inst.dueDate,
                    principalDue: Number(inst.principalDue),
                    interestDue: Number(inst.interestDue),
                    penaltyDue: shouldReset ? 0 : Number(inst.penaltyDue), // Reset penalty due if replaying
                    feeDue: Number(inst.feeDue),
                    principalPaid: shouldReset ? 0 : Number(inst.principalPaid),
                    interestPaid: shouldReset ? 0 : Number(inst.interestPaid),
                    penaltyPaid: shouldReset ? 0 : Number(inst.penaltyPaid),
                    feesPaid: shouldReset ? 0 : Number(inst.feesPaid),
                    isFullyPaid: shouldReset ? false : inst.isFullyPaid,
                    wasModified: shouldReset
                }
            })

            // 3. Fetch REPAYMENT, WAIVER, and PENALTY transactions
            const transactions = await prisma.loanTransaction.findMany({
                where: {
                    loanId,
                    type: { in: ['REPAYMENT', 'WAIVER', 'PENALTY'] },
                    isReversed: false,
                    ...(fromDate && { postedAt: { gte: fromDate } })
                },
                orderBy: { postedAt: 'asc' }
            })

            let transactionsReplayed = 0

            for (const txn of transactions) {
                const amount = Number(txn.amount)

                if (txn.type === 'PENALTY') {
                    // Find the installment this penalty was applied to (by matching amount and past due)
                    // In a more robust system, we would have an installmentId on the transaction.
                    const affectedInst = installmentsState.find(i => 
                        i.dueDate < txn.postedAt && 
                        (i.penaltyDue === 0 || i.penaltyDue === amount) // Match either unpenalized or matching amount
                    )

                    if (affectedInst) {
                        // Validate: Is the installment still in arrears?
                        const principalOwed = affectedInst.principalDue - affectedInst.principalPaid
                        const interestOwed = affectedInst.interestDue - affectedInst.interestPaid
                        
                        if (principalOwed + interestOwed > 0) {
                            // Penalty is still valid
                            affectedInst.penaltyDue = amount
                            affectedInst.wasModified = true
                        } else {
                            // Penalty is NO LONGER VALID. Neutralize it.
                            await neutralizePenalty(txn);
                        }
                    } else {
                        // NO INSTALLMENT FOUND (e.g. penalty applied before first due date). Neutralize it.
                        await neutralizePenalty(txn);
                    }

                    async function neutralizePenalty(txn: any) {
                        console.log(`Neutralizing invalid penalty ${txn.id} (No valid/arrears installment) for loan ${loanId}`)
                        
                        // 1. Mark transaction as reversed
                        await prisma.loanTransaction.update({
                            where: { id: txn.id },
                            data: { 
                                isReversed: true,
                                description: `Auto-Neutralized: ${txn.description}`
                            }
                        })

                        // 2. Reverse Ledger (if exists)
                        const ledgerTx = await prisma.ledgerTransaction.findFirst({
                            where: { externalReferenceId: txn.id }
                        }) || await prisma.ledgerTransaction.findUnique({
                            where: { id: txn.referenceId || '' }
                        })

                        if (ledgerTx) {
                            await AccountingEngine.reverseJournalEntry(
                                ledgerTx.id,
                                'Auto-neutralized by backdated payment',
                                'SYSTEM',
                                'System Replay',
                                prisma
                            )
                        }

                        // 3. Update in-memory state
                        // If we had an affectedInst, we would set penaltyDue to 0. 
                        // If we don't, it doesn't matter for the in-memory schedule.
                        if (affectedInst) {
                            affectedInst.penaltyDue = 0
                            affectedInst.wasModified = true
                        }
                    }
                    continue // Penalties don't follow waterfall allocation, they ARE the due amount
                }

                let remainingAmount = amount
                let allocPrincipal = 0
                let allocInterest = 0
                let allocPenalty = 0
                let allocFees = 0

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

                    const TOLERANCE = 0.01
                    const totalDue = inst.penaltyDue + inst.feeDue + inst.interestDue + inst.principalDue
                    const totalPaid = inst.penaltyPaid + inst.feesPaid + inst.interestPaid + inst.principalPaid

                    if (totalPaid >= totalDue - TOLERANCE) {
                        inst.isFullyPaid = true
                        inst.wasModified = true
                    }
                }

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

            const modifiedInstallments = installmentsState.filter(i => i.wasModified)

            await Promise.all(modifiedInstallments.map(inst =>
                prisma.repaymentInstallment.update({
                    where: { id: inst.id },
                    data: {
                        principalPaid: new Prisma.Decimal(inst.principalPaid),
                        interestPaid: new Prisma.Decimal(inst.interestPaid),
                        penaltyDue: new Prisma.Decimal(inst.penaltyDue),
                        penaltyPaid: new Prisma.Decimal(inst.penaltyPaid),
                        feesPaid: new Prisma.Decimal(inst.feesPaid),
                        isFullyPaid: inst.isFullyPaid
                    }
                })
            ))

            let totalDue = new Prisma.Decimal(0)
            let totalPaid = new Prisma.Decimal(0)

            for (const inst of installmentsState) {
                totalDue = totalDue.add(inst.principalDue).add(inst.interestDue).add(inst.penaltyDue).add(inst.feeDue)
                totalPaid = totalPaid.add(inst.principalPaid).add(inst.interestPaid).add(inst.penaltyPaid).add(inst.feesPaid)
            }

            const outstandingBalance = totalDue.sub(totalPaid)

            await prisma.loan.update({
                where: { id: loanId },
                data: { 
                    outstandingBalance,
                    current_balance: outstandingBalance
                }
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
                maxWait: 10000,
                timeout: 60000
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

            await this.replayTransactions(loanId, paymentDate, tx)
        }, {
            maxWait: 10000,
            timeout: 120000
        })
    }

    /**
     * Insert a back-dated adjustment and replay subsequent transactions
     * 
     * @param loanId - The loan receiving the adjustment
     * @param type - Adjustment type (INCREASE/DECREASE)
     * @param amount - Adjustment amount
     * @param adjustmentDate - The historical date of the adjustment
     * @param description - Adjustment description
     */
    static async insertBackdatedAdjustment(
        loanId: string,
        type: 'WAIVER' | 'PENALTY' | 'INTEREST',
        amount: number,
        adjustmentDate: Date,
        description: string = 'Back-dated Adjustment',
        referenceId?: string // Link to LedgerTransaction
    ): Promise<void> {

        return await db.$transaction(async (tx) => {
            // 1. Create the transaction record
            await tx.loanTransaction.create({
                data: {
                    loanId,
                    type,
                    amount: new Prisma.Decimal(amount),
                    description,
                    postedAt: adjustmentDate,
                    transactionDate: adjustmentDate,
                    referenceId,
                    // Allocation will be calculated during replay
                    principalAmount: new Prisma.Decimal(0),
                    interestAmount: new Prisma.Decimal(0),
                    penaltyAmount: new Prisma.Decimal(0),
                    feeAmount: new Prisma.Decimal(0)
                }
            })

            await this.replayTransactions(loanId, adjustmentDate, tx)
        }, {
            maxWait: 10000,
            timeout: 120000
        })
    }

    /**
     * Reverse a transaction and replay
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
        }, {
            maxWait: 10000,
            timeout: 120000
        })
    }
}
