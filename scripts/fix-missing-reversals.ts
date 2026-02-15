
import { db } from '@/lib/db'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'
import { revalidatePath } from 'next/cache'

async function main() {
    console.log('--- Repair Script: Fixing Missing Reversal Entries ---')

    // 1. Find all Loan Transactions that are marked REVERSED
    // Filter for LN015 specifically to debug
    const targetLoanAppNum = 'LN015'
    const loan = await db.loan.findUnique({ where: { loanApplicationNumber: targetLoanAppNum } })

    if (!loan) return

    const reversedTxs = await db.loanTransaction.findMany({
        where: {
            isReversed: true,
            loanId: loan.id
        }
    })

    console.log(`Found ${reversedTxs.length} reversed transactions. Checking for contra-entries...`)

    let fixedCount = 0

    for (const tx of reversedTxs) {
        // 2. Check if a "REVERSAL" transaction exists pointing to this ID
        const reversalEntry = await db.loanTransaction.findFirst({
            where: {
                referenceId: tx.id,
                type: 'REVERSAL'
            }
        })

        if (!reversalEntry) {
            console.log(`[FIX] Missing Reversal Entry for Tx ID: ${tx.id} (${tx.type} - ${tx.amount})`)

            // 3. Create the missing REVERSAL transaction
            await db.loanTransaction.create({
                data: {
                    loanId: tx.loanId,
                    type: 'REVERSAL',
                    amount: tx.amount,
                    description: `System Fix: Auto-generated Reversal for ${tx.type}`,
                    postedAt: new Date(), // Now
                    transactionDate: new Date(),
                    referenceId: tx.id,
                    principalAmount: tx.principalAmount,
                    interestAmount: tx.interestAmount,
                    penaltyAmount: tx.penaltyAmount,
                    feeAmount: tx.feeAmount
                }
            })

            // 4. Trigger Replay for this loan to fix balances
            console.log(`[FIX] Replaying transactions for Loan: ${tx.loanId}`)
            await TransactionReplayService.replayTransactions(tx.loanId)

            // 5. Attempt Revalidate (might fail in script)
            try {
                // We can't use revalidatePath in script easily, but we try purely for completeness
                // revalidatePath(`/loans/${tx.loanId}`) 
            } catch (e) { }

            fixedCount++
        } else {
            console.log(`[SKIP] Tx ${tx.id} (${tx.amount}) already has reversal: ${reversalEntry.id} (Ref: ${reversalEntry.referenceId})`)
        }
    }

    console.log(`--- Repair Complete ---`)
    console.log(`Fixed ${fixedCount} transactions.`)
}

main()
