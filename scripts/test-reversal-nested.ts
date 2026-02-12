
import { PrismaClient } from '@prisma/client'
import { TransactionReplayService } from '../lib/services/TransactionReplayService'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("Testing Nested Transaction Reversal...")

    // 1. Find a loan
    const loan = await prisma.loan.findFirst({
        include: { member: { include: { wallet: true } }, loanProduct: true }
    })

    if (!loan) { console.error("No loan found"); return }
    console.log(`Using Loan: ${loan.loanApplicationNumber}`)

    // 2. Create Test Transaction
    const txDate = subDays(new Date(), 2)
    const repayment = await prisma.loanTransaction.create({
        data: {
            loanId: loan.id,
            type: 'REPAYMENT',
            amount: 5000,
            principalAmount: 5000,
            interestAmount: 0,
            description: 'Nested Reversal Test',
            postedAt: txDate,
            transactionDate: txDate,
            isReversed: false
        }
    })
    console.log(`Created TX: ${repayment.id}`)

    // 3. Execute Logic mimicking reverseLoanTransaction
    try {
        await prisma.$transaction(async (tx) => {
            console.log("Inside transaction...")

            // a. Update isReversed
            await tx.loanTransaction.update({
                where: { id: repayment.id },
                data: { isReversed: true, reversedAt: new Date() }
            })
            console.log("Updated isReversed=true")

            // b. Call Replay Service with TX
            await TransactionReplayService.replayTransactions(loan.id, undefined, tx)
            console.log("Called replayTransactions")
        })
        console.log("Transaction Committed.")
    } catch (e: any) {
        console.error("Transaction FAILED / ROLLED BACK:", e.message)
        await prisma.loanTransaction.delete({ where: { id: repayment.id } })
        return
    }

    // 4. VerifyDB State
    const check = await prisma.loanTransaction.findUnique({ where: { id: repayment.id } })
    console.log(`Final DB State | isReversed: ${check?.isReversed}`)

    if (check?.isReversed) {
        console.log("SUCCESS: Reversal persisted.")
    } else {
        console.error("FAILURE: Reversal NOT persisted.")
    }

    // Cleanup
    await prisma.loanTransaction.delete({ where: { id: repayment.id } })
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
