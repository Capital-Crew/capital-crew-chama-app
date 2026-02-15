
import { db } from '@/lib/db'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'
import { Prisma } from '@prisma/client'

async function main() {
    console.log('--- Scanning for Inconsistent Reversals (Ledger Reversed, Domain Active) ---')

    // 1. Find all Reversed Ledger Transactions that are linked to Loans or Wallets
    const reversedJournals = await db.ledgerTransaction.findMany({
        where: {
            isReversed: true,
            referenceType: { in: ['LOAN_REPAYMENT', 'LOAN_DISBURSEMENT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL'] }
        }
    })

    console.log(`Found ${reversedJournals.length} reversed journals. Checking domain status...`)

    let fixedCount = 0

    for (const journal of reversedJournals) {
        const refId = journal.referenceId

        // 2. check Domain Status
        // Try Loan Transaction first
        const loanTx = await db.loanTransaction.findUnique({ where: { id: refId } })

        if (loanTx) {
            if (!loanTx.isReversed) {
                console.log(`[FIXING] Loan Tx ${loanTx.id} (Journal Reversed, Domain Active)`)
                await fixLoanTransaction(loanTx, journal)
                fixedCount++
            }
            continue
        }

        // Try Wallet Transaction
        const walletTx = await db.walletTransaction.findUnique({ where: { id: refId } })
        if (walletTx) {
            if (!walletTx.isReversed) {
                console.log(`[FIXING] Wallet Tx ${walletTx.id} (Journal Reversed, Domain Active)`)
                await fixWalletTransaction(walletTx, journal)
                fixedCount++
            }
            continue
        }
    }

    console.log(`\nScan Complete. Fixed ${fixedCount} inconsistencies.`)
}

async function fixLoanTransaction(loanTx: any, journal: any) {
    await db.$transaction(async (tx) => {
        // 1. Mark as Reversed
        await tx.loanTransaction.update({
            where: { id: loanTx.id },
            data: { isReversed: true }
        })

        // 2. Create Reversal Placeholder (for Statement)
        // We do NOT post to ledger, because ledger is already reversed (the cause of this inconsistency)
        await tx.loanTransaction.create({
            data: {
                loanId: loanTx.loanId,
                type: 'REVERSAL',
                amount: loanTx.amount,
                description: `Reversal: ${loanTx.description} (Ledger Sync)`,
                postedAt: new Date(),
                isReversed: false,
                principalAmount: new Prisma.Decimal(0),
                interestAmount: new Prisma.Decimal(0),
                penaltyAmount: new Prisma.Decimal(0),
                feeAmount: new Prisma.Decimal(0),
                // Important: Link to the reversal journal entry if possible? 
                // The journal reversal entry ID is `journal.reversedBy`.
            }
        })

        // 3. Replay Schedule
        // Pass tx to ensure it sees the update
        await TransactionReplayService.replayTransactions(loanTx.loanId, loanTx.postedAt, tx)
    }, {
        maxWait: 5000,
        timeout: 20000
    })
    console.log(`  -> Fixed Loan Tx ${loanTx.id}`)
}

async function fixWalletTransaction(walletTx: any, journal: any) {
    await db.$transaction(async (tx) => {
        // 1. Mark as Reversed
        await tx.walletTransaction.update({
            where: { id: walletTx.id },
            data: { isReversed: true }
        })

        // 2. Create Reversal Placeholder
        await tx.walletTransaction.create({
            data: {
                walletId: walletTx.walletId,
                type: 'REVERSAL', // Ensure this enum exists for WalletTransaction or use generic 'ADJUSTMENT'
                amount: walletTx.amount,
                description: `Reversal: ${walletTx.description} (Ledger Sync)`,
                status: 'COMPLETED',
                referenceId: journal.reversedBy, // Link to the reversal journal
                isReversed: false
            }
        })

        // No replay service for wallets, just balance update? 
        // Wallet balance is derived from Ledger. Since Ledger is reversed, 
        // `getMemberWalletBalance` should already be correct. 
        // We just need the Statement (WalletTransaction list) to show the reversal.

    })
    console.log(`  -> Fixed Wallet Tx ${walletTx.id}`)
}

main()
