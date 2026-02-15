
import { TransactionReversalService } from '@/lib/services/TransactionReversalService'
import { db } from '@/lib/db'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'

async function main() {
    console.log('--- Testing Cascading Reversal (Wallet -> Loan) ---')

    // 1. Setup: Create a Mock Loan & Repayment
    // We'll mimic the flow: Disbursement -> Repayment -> Reversal (of Repayment from Wallet)

    // Find an active loan to use (or creating one is safer but complex)
    // Let's look for an existing loan with a repayment
    const existingLoan = await db.loan.findFirst({
        where: { status: 'ACTIVE' },
        include: { member: { include: { wallet: true, user: true } } }
    })

    if (!existingLoan || !existingLoan.member?.wallet) {
        console.log('No active loan/wallet found for test.')
        return
    }

    console.log(`Using Loan: ${existingLoan.loanApplicationNumber} (${existingLoan.id})`)
    const walletId = existingLoan.member.wallet.id
    const userId = existingLoan.member.user?.id // Access user ID from relation



    // 2. Simulate a Repayment (Wallet Debit, Loan Credit)
    // We refrain from actually moving real money if possible, or we run this in a transaction and rollback?
    // Hard to rollback a whole script.
    // Let's create a "Test Repayment" and then reverse it.

    const amount = 500

    // Create Wallet Entry (Debit)
    const walletTx = await db.walletTransaction.create({
        data: {
            walletId: walletId,
            type: 'WITHDRAWAL', // Repayment is a withdrawal from wallet
            amount: amount,
            description: 'Test Repayment for Cascading Reversal',
            balanceAfter: 0, // Placeholder
            relatedLoanId: existingLoan.id, // CRITICAL LINK
            immutable: false
        }
    })
    console.log(`Created Wallet Tx: ${walletTx.id}`)

    // Create Loan Entry (Credit)
    const loanTx = await db.loanTransaction.create({
        data: {
            loanId: existingLoan.id,
            type: 'REPAYMENT',
            amount: amount,
            description: 'Test Repayment Loan Entry',
            principalAmount: amount, // Simplified
        }
    })
    console.log(`Created Loan Tx: ${loanTx.id}`)

    // Link them via GL (Mocking the GL link used to find it)
    // The service uses relatedLoanId on WalletTx + match by amount/type on LoanTx.
    // My updated logic:
    // const loanTx = await tx.loanTransaction.findFirst({ where: { loanId: walletTx.relatedLoanId, amount: walletTx.amount, type: 'REPAYMENT' } })
    // So this should be enough.

    // 3. Perform Reversal on WALLET Transaction
    console.log('--- Executing Reversal on WALLET Transaction ---')
    const result = await TransactionReversalService.reverseTransaction(
        walletTx.id,
        'SAVINGS', // Context is Wallet/Savings
        'Testing Cascade',
        userId || 'system' // Use valid ID
    )

    console.log('Reversal Result:', result)

    // 4. Verify Loan Transaction Status
    const updatedLoanTx = await db.loanTransaction.findUnique({
        where: { id: loanTx.id }
    })

    console.log('--- Verification ---')
    console.log(`Loan Tx Is Reversed: ${updatedLoanTx?.isReversed}`)

    if (updatedLoanTx?.isReversed) {
        console.log('SUCCESS: Cascading reversal worked!')
    } else {
        console.error('FAILURE: Loan Transaction was NOT reversed.')
    }

    // cleanup?
}

main()
