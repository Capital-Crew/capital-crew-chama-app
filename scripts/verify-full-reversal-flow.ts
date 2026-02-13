
import { PrismaClient } from '@prisma/client'
import { getLoanStatement } from '../app/actions/getLoanStatement'
import { processTransactions } from '../lib/statementProcessor'
import { reverseLoanTransaction } from '../app/actions/loan-reversal-actions'
import { AccountingEngine } from '../lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting End-to-End Reversal Verification...")

    // 1. Setup: Find a test user/loan
    const loan = await prisma.loan.findFirst({
        where: { status: 'ACTIVE' },
        include: { member: { include: { wallet: true } } }
    })

    if (!loan) throw new Error("No active loan found for testing")
    console.log(`Using Loan: ${loan.loanApplicationNumber}`)

    // 1.5 Ensure Loan has Installments (Required for Replay Service)
    const installmentCount = await prisma.repaymentInstallment.count({ where: { loanId: loan.id } })
    if (installmentCount === 0) {
        console.log("No installments found. Creating dummy installment for testing...")
        await prisma.repaymentInstallment.create({
            data: {
                loanId: loan.id,
                installmentNumber: 1,
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                principalDue: 10000,
                interestDue: 1000,
                principalPaid: 0,
                interestPaid: 0,
                penaltyPaid: 0,
                feesPaid: 0
            }
        })
    }

    // 2. Create a fresh Repayment Transaction
    const txAmount = 500
    const tx = await prisma.$transaction(async (prismaTx) => {
        // Create Transaction
        // @ts-ignore
        const loanTx = await prismaTx.loanTransaction.create({
            data: {
                loanId: loan.id,
                type: 'REPAYMENT',
                amount: txAmount,
                principalAmount: txAmount,
                description: 'E2E Verification Repayment',
                postedAt: new Date(),
                transactionDate: new Date(),
                isReversed: false
            }
        })

        // Find Wallet GL Account Code
        const walletGl = await prismaTx.ledgerAccount.findUnique({ where: { id: loan.member.wallet?.glAccountId } })
        if (!walletGl) throw new Error("Wallet GL Account not found")

        // Find balancing account (Asset or Liability that is NOT the wallet)
        const balancingAccount = await prismaTx.ledgerAccount.findFirst({
            where: { code: { not: walletGl.code } }
        })
        if (!balancingAccount) throw new Error("No balancing account found")

        // Post GL
        await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: 'LOAN_REPAYMENT',
            referenceId: loan.id,
            externalReferenceId: loanTx.id,
            description: 'E2E Repayment GL',
            lines: [
                { accountCode: balancingAccount.code, debitAmount: 0, creditAmount: txAmount, description: 'Balancing Entry' },
                { accountCode: walletGl.code, debitAmount: txAmount, creditAmount: 0, description: 'Wallet' }
            ],
            createdBy: 'TEST',
            createdByName: 'TEST'
        }, prismaTx)

        return loanTx
    })

    console.log(`Created Repayment TX: ${tx.id}. Verifying Statement BEFORE Reversal...`)

    // UPDATE CACHE (Simulate system behavior)
    // We import DYNAMICALLY to avoid top-level await issues if any
    const { TransactionReplayService } = await import('../lib/services/TransactionReplayService')
    await TransactionReplayService.replayTransactions(loan.id)

    // 3. Verify Statement Effect (Running Balance should reflect the payment)
    const stmtBefore = await getLoanStatement(loan.id)
    const rowBefore = stmtBefore.walletTransactions.find((r: any) => r.id === tx.id)

    if (!rowBefore) throw new Error("Transaction not found in statement!")
    console.log(`[Before] TX Found. reversed: ${rowBefore.isReversed}`)

    // Check Total Outstanding Balance Before
    const loanBefore = await prisma.loan.findUnique({ where: { id: loan.id } })
    console.log(`[Before Reversal] Outstanding Balance: ${loanBefore?.outstandingBalance}`)


    // 4. Perform Reversal (Manually calling logic to bypass Auth checks in script)
    console.log("Executing Reversal...")

    await prisma.$transaction(async (txClient) => {
        // Soft Reversal
        await txClient.loanTransaction.update({
            where: { id: tx.id },
            data: { isReversed: true, reversedAt: new Date() }
        })

        // Smart GL Reversal
        const linkedGl = await txClient.ledgerTransaction.findFirst({ where: { externalReferenceId: tx.id } })
        if (linkedGl) {
            await AccountingEngine.reverseJournalEntry(linkedGl.id, "E2E Reversal", "TEST", "TEST", txClient)
            console.log("GL Reversal Executed.")
        }
    })

    // CRITICAL: Replay Transactions to update Loan Cache
    await TransactionReplayService.replayTransactions(loan.id)


    // 5. Verify Statement Effect (AFTER Reversal)
    console.log("Verifying Statement AFTER Reversal...")
    const stmtAfter = await getLoanStatement(loan.id)

    // Check Total Outstanding Balance After
    const loanAfter = await prisma.loan.findUnique({ where: { id: loan.id } })
    console.log(`[After Reversal] Outstanding Balance: ${loanAfter?.outstandingBalance}`)

    const delta = Number(loanAfter?.outstandingBalance) - Number(loanBefore?.outstandingBalance)
    console.log(`[Result] Balance Change: ${delta}`)

    if (Math.abs(delta - txAmount) < 0.01) {
        console.log("SUCCESS: Outstanding Balance increased by the reversed amount (Liability Restored).")
    } else {
        console.error(`FAILURE: Balance did not increase correctly. Expected +${txAmount}, got ${delta}`)
    }

    // Process transactions to get running balance
    const processedRows = processTransactions(stmtAfter.walletTransactions)
    const rowAfter = processedRows.find((r: any) => r.txId === tx.id)

    if (!rowAfter) throw new Error("Transaction disappeared from statement! (Filter Bug?)")

    console.log(`[After] TX Found. Description: "${rowAfter.description}", isVoided: ${rowAfter.isVoided}`)
    console.log(`[After] Row Data: Debit: ${rowAfter.debit}, Credit: ${rowAfter.credit}, RunningBalance: ${rowAfter.runningBalance}`)

    if (rowAfter.isVoided !== true) {
        throw new Error("FAILED: Transaction is NOT marked as voided in statement.")
    }

    // Verify Running Balance Logic
    const sortedRows = processedRows
    const rowIndex = sortedRows.findIndex((r: any) => r.txId === tx.id)

    if (rowIndex > 0) {
        const prevRow = sortedRows[rowIndex - 1]
        console.log(`[After] Prev Row Balance: ${prevRow.runningBalance}`)
        console.log(`[After] This Row Balance: ${rowAfter.runningBalance}`)

        if (Math.abs(rowAfter.runningBalance - prevRow.runningBalance) > 0.01) {
            throw new Error("FAILED: Running Balance changed! The reversed transaction should have 0 effect.")
        } else {
            console.log("SUCCESS: Running Balance is unchanged by this transaction (Effective Amount = 0).")
        }
    }

    // Check GL Final State
    const glCheck = await prisma.ledgerTransaction.findFirst({ where: { externalReferenceId: tx.id } })
    console.log(`GL Reversed? ${glCheck?.isReversed}`)

    if (glCheck?.isReversed) {
        console.log("SUCCESS: End-to-End Reversal Verified.")
    } else {
        console.error("FAILURE: GL not reversed.")
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
