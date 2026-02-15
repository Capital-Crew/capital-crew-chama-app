
import { db } from '@/lib/db'
import { getLoanStatement } from '@/app/actions/getLoanStatement'
import { TransactionReversalService } from '@/lib/services/TransactionReversalService'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'

async function main() {
    console.log('--- Simulation: Loan Statement Reversal ---')

    // 1. Setup: Use LN015 
    const loanAppNum = 'LN015'
    const loan = await db.loan.findUnique({
        where: { loanApplicationNumber: loanAppNum },
        include: { member: { include: { wallet: true, user: true } } }
    })

    if (!loan) {
        console.error('Loan LN015 not found')
        return
    }

    const member = loan.member
    if (!member) throw new Error('Member not found')

    // 2. Initial State
    console.log('\n[1] Fetching Initial Statement...')
    console.log('Function Source:', getLoanStatement.toString().substring(0, 200))
    let statement = await getLoanStatement(loan.id)
    console.log('Statement Keys:', Object.keys(statement || {}))

    if (!statement || !statement.walletTransactions) {
        console.error('Invalid Statement Response:', statement)
        return
    }

    let initialBalance = statement.walletTransactions[statement.walletTransactions.length - 1]?.runningBalance || 0
    console.log(`Initial Running Balance: ${initialBalance}`)

    // 3. Action: Make a Repayment
    const repaymentAmount = 5000
    console.log(`\n[2] Simulating Repayment of ${repaymentAmount}...`)

    // Create Wallet Tx
    const walletTx = await db.walletTransaction.create({
        data: {
            walletId: member.wallet!.id,
            type: 'DEPOSIT', // Money IN to wallet first? No, Repayment is usually DEBIT wallet.
            // But for simulation, let's just create the Wallet DEBIT and Loan CREDIT directly.
            amount: repaymentAmount,
            balanceAfter: 0,
            description: 'Simulated Repayment',
            relatedLoanId: loan.id
        }
    })

    // Create Loan Tx
    const loanTx = await db.loanTransaction.create({
        data: {
            loanId: loan.id,
            type: 'REPAYMENT',
            amount: repaymentAmount,
            description: 'Simulated Repayment',
            postedAt: new Date(),
            transactionDate: new Date(),
            principalAmount: repaymentAmount,
            interestAmount: 0,
            penaltyAmount: 0,
            feeAmount: 0
        }
    })

    // Replay to update balance
    await TransactionReplayService.replayTransactions(loan.id)

    // 4. Verify Repayment Effect
    console.log('\n[3] Fetching Statement after Repayment...')
    statement = await getLoanStatement(loan.id)
    let postRepaymentBalance = statement.walletTransactions[statement.walletTransactions.length - 1]?.runningBalance || 0
    console.log(`Post-Repayment Balance: ${postRepaymentBalance}`)

    if (postRepaymentBalance >= initialBalance) {
        console.error('ERROR: Balance did not decrease after repayment!')
    } else {
        console.log('SUCCESS: Balance decreased as expected.')
    }

    // 5. Action: Reverse the Repayment (Cascading from Wallet)
    console.log(`\n[4] Reversing the Repayment (Cascading)...`)
    const adminId = member.user?.id || 'system' // Use a valid user ID for audit

    const reversalResult = await TransactionReversalService.reverseTransaction(
        walletTx.id,
        'SAVINGS', // Context is Wallet
        'Simulation Reversal',
        adminId
    )

    if (!reversalResult.success) {
        console.error('Reversal Failed:', reversalResult.error)
        return
    }

    // 6. Verify Reversal Effect
    console.log('\n[5] Fetching Statement after Reversal...')
    statement = await getLoanStatement(loan.id)
    let finalBalance = statement.walletTransactions[statement.walletTransactions.length - 1]?.runningBalance || 0
    console.log(`Final Running Balance: ${finalBalance}`)

    const diff = Math.abs(finalBalance - initialBalance)
    if (diff < 1.0) { // Allow small rounding diffs from interest recalculation
        console.log('SUCCESS: Balance returned to initial state (approx).')
    } else {
        console.log(`WARNING: Balance mismatch. Initial: ${initialBalance}, Final: ${finalBalance}, Diff: ${diff}`)
        console.log('Note: Interest recalculation might cause slight differences depending on date shifts.')
    }

    // List last 5 transactions to show the trail
    console.log('\n--- Transaction Trail (Last 5) ---')
    const trail = statement.walletTransactions.slice(-5)
    console.table(trail.map((t: any) => ({
        date: t.date?.toISOString().split('T')[0] || t.createdAt?.toISOString().split('T')[0],
        type: t.type,
        amount: t.amount,
        balance: t.runningBalance,
        desc: t.description
    })))
}

main()
