
import { PrismaClient } from '@prisma/client'
import { AccountingEngine } from '../lib/accounting/AccountingEngine'
import { TransactionReplayService } from '../lib/services/TransactionReplayService'

const prisma = new PrismaClient()

async function resetTest() {
    // Optional: Reset specific test data if needed
}

async function verifyReversal() {
    console.log('--- Starting Reversal Verification ---')

    // 1. Find a target loan/repayment
    // Find a loan that has installments AND repayments
    const loanWithInstallments = await prisma.loan.findFirst({
        where: {
            repaymentInstallments: { some: {} },
            transactions: { some: { type: 'REPAYMENT', isReversed: false, amount: { gt: 0 } } }
        },
        include: {
            transactions: {
                where: { type: 'REPAYMENT', isReversed: false, amount: { gt: 0 } },
                take: 1
            }
        }
    })

    if (!loanWithInstallments || !loanWithInstallments.transactions[0]) {
        console.log('No eligible loan with installments and repayments found.')
        return
    }

    const transaction = loanWithInstallments.transactions[0]
    // Re-fetch to get loan details if needed, though we have it via relation if we included it.
    // Let's just use what we have, but we need Loan object for output.
    const loan = loanWithInstallments
    transaction.loan = loan as any

    if (!transaction) {
        console.log('No eligible repayment found for testing.')
        return
    }

    console.log(`Target Transaction: ${transaction.id} | Amount: ${transaction.amount} | Loan: ${transaction.loan.loanApplicationNumber}`)
    console.log(`Loan Balance BEFORE: ${transaction.loan.outstandingBalance}`)

    // 2. Perform Reversal Logic (Mirroring the Action)
    // We mock the user and logic here
    const userId = 'test-admin-id'
    const userName = 'Test Admin'
    const reason = 'Automated Verification Reversal'

    try {
        await prisma.$transaction(async (tx) => {
            // A. Mark as reversed
            await tx.loanTransaction.update({
                where: { id: transaction.id },
                data: { isReversed: true, reversedAt: new Date() }
            })
            console.log('STEP A: Transaction marked as reversed.')

            // B. GL Reversal (if applicable)
            const linkedGlEntry = await tx.ledgerTransaction.findFirst({
                where: { externalReferenceId: transaction.id }
            })

            if (linkedGlEntry) {
                await AccountingEngine.reverseJournalEntry(
                    linkedGlEntry.id,
                    reason,
                    userId,
                    userName,
                    tx as any // Cast flexibility
                )
                console.log('STEP B: GL Entry reversed.')
            } else {
                console.log('STEP B: No linked GL entry found. Skipping GL reversal.')
            }

            // C. Replay Tranasctions (Update Balance/Installments)
            const result = await TransactionReplayService.replayTransactions(transaction.loanId, undefined, tx)
            console.log('STEP C: Transactions replayed.', result)
        }, {
            maxWait: 10000, // default: 2000
            timeout: 20000, // default: 5000
        })

        // 3. Verify Final State
        const updatedLoan = await prisma.loan.findUnique({ where: { id: transaction.loanId } })
        console.log(`Loan Balance AFTER: ${updatedLoan?.outstandingBalance}`)

        // Check if balance increased (since we reversed a repayment)
        // Original Repayment reduced balance. Reversal should increase it back.
        // E.g. Balance 500. Repay 100 -> Balance 400. Reverse Repay -> Balance 500.
        // However, TransactionReplayService recalculates from scratch.
        // It relies on "totalDue - totalPaid".
        // When we reverse, we un-pay the installments. So totalPaid decreases.
        // totalDue - (totalPaid - 100) = Balance + 100.

        const change = Number(updatedLoan?.outstandingBalance) - Number(transaction.loan.outstandingBalance)
        console.log(`Balance Change: ${change} (Expected ~${transaction.amount})`)

        if (Math.abs(change - Number(transaction.amount)) < 1) {
            console.log('SUCCESS: Balance updated correctly.')
        } else {
            console.log('WARNING: Balance change does not match transaction amount exactly. Check for penalties/interest accrual differences or multiple updates.')
        }

    } catch (e) {
        console.error('Reversal Failed:', e)
    }
}

verifyReversal()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
