
import { db } from '@/lib/db'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'

async function main() {
    console.log('--- Repair Script: Syncing Wallet Reversals to Loan ---')

    // 1. Find all Wallet Transactions that are REVERSED and linked to a Loan
    const reversedWalletTxs = await db.walletTransaction.findMany({
        where: {
            isReversed: true,
            relatedLoanId: { not: null }
        },
        include: {
            // we need details of the linked loan tx
        }
    })

    console.log(`Found ${reversedWalletTxs.length} reversed wallet transactions linked to loans. Checking consistency...`)

    let fixedCount = 0

    for (const walletTx of reversedWalletTxs) {
        // 2. Find the corresponding Loan Transaction
        // We match by loanId and amount (and ideally roughly same time, or type REPAYMENT)

        // Strategy: Look for an ACTIVE (not reversed) Loan Transaction that matches
        const loanTx = await db.loanTransaction.findFirst({
            where: {
                loanId: walletTx.relatedLoanId!,
                amount: walletTx.amount, // Amounts should match
                isReversed: false,       // We are looking for those NOT yet reversed
                type: 'REPAYMENT'        // Usually Repayment
            }
        })

        if (loanTx) {
            console.log(`[FIX] Found Inconsistent State!`)
            console.log(`- Wallet Tx: ${walletTx.id} (Reversed: true)`)
            console.log(`- Loan Tx:   ${loanTx.id} (Reversed: false)`)

            // 3. Fix it: Mark Reversed and Create Contra
            await db.$transaction(async (tx) => {
                // A. Mark Loan Tx as Reversed
                await tx.loanTransaction.update({
                    where: { id: loanTx.id },
                    data: {
                        isReversed: true,
                        reversedAt: new Date(),
                        description: `${loanTx.description} [REVERSED]`
                    }
                })

                // B. Create Reversal Entry
                await tx.loanTransaction.create({
                    data: {
                        loanId: loanTx.loanId,
                        type: 'REVERSAL',
                        amount: loanTx.amount,
                        description: `System Fix: Sync with Wallet Reversal ${walletTx.id}`,
                        postedAt: new Date(),
                        transactionDate: new Date(),
                        referenceId: loanTx.id, // Point to the loan transaction
                        principalAmount: loanTx.principalAmount,
                        interestAmount: loanTx.interestAmount,
                        penaltyAmount: loanTx.penaltyAmount,
                        feeAmount: loanTx.feeAmount
                    }
                })

                // C. Replay
                await TransactionReplayService.replayTransactions(loanTx.loanId, undefined, tx)
            }, {
                maxWait: 5000,
                timeout: 20000
            })

            console.log(`[SUCCESS] Fixed Loan Tx ${loanTx.id}`)
            fixedCount++
        } else {
            // console.log(`[OK] Wallet Tx ${walletTx.id} has no conflicting active loan tx.`)
        }
    }

    console.log(`--- Sync Complete ---`)
    console.log(`Fixed ${fixedCount} inconsistencies.`)
}

main()
