
import { WalletService } from '../lib/services/WalletService'
import { DisbursementService } from '../lib/services/DisbursementService'
import { RepaymentService } from '../lib/services/RepaymentService'
import { db as prisma } from '../lib/db'
import { WalletStatus } from '@prisma/client'

async function main() {
    console.log('--- STARTING PHASE 3 VERIFICATION (Disbursement) ---')

    // 1. Setup Environment
    // Create Member & Wallet
    const member = await prisma.member.create({
        data: {
            memberNumber: Math.floor(Math.random() * 1000000),
            name: 'Borrower Test',
            contact: 'borrower@test.com'
        }
    })
    const wallet = await WalletService.createWallet(member.id)
    console.log(`[PASS] Created Wallet: ${wallet.accountRef}`)

    // Create Loan Product
    const product = await prisma.loanProduct.create({
        data: {
            name: 'Test Loan Product ' + Date.now(),
            shortCode: 'LP-' + Date.now(),
            principal: 10000,
            numberOfRepayments: 1,
            repaymentEvery: 1,
            repaymentFrequencyType: 'MONTHS',
            interestRatePerPeriod: 5,
            interestType: 'FLAT',
            interestCalculationPeriodType: 'SAME_AS_REPAYMENT',
            amortizationType: 'EQUAL_INSTALLMENTS',
            charges: []
        }
    })
    console.log(`[PASS] Created Product: ${product.name}`)

    // Create Portfolio Asset Account
    const portfolioAccount = await prisma.ledgerAccount.create({
        data: {
            code: '1300-PORTFOLIO-' + Date.now(),
            name: 'Loan Portfolio (Asset)',
            type: 'ASSET'
        }
    })

    // Map Product -> LOAN_PORTFOLIO
    await prisma.productAccountingMapping.create({
        data: {
            productId: product.id,
            accountType: 'LOAN_PORTFOLIO',
            accountId: portfolioAccount.id
        }
    })
    console.log(`[PASS] Mapped Product -> LOAN_PORTFOLIO (${portfolioAccount.code})`)

    // Create Loan Application
    const loan = await prisma.loan.create({
        data: {
            loanApplicationNumber: 'LN-' + Date.now(),
            memberId: member.id,
            loanProductId: product.id,
            amount: 10000,
            status: 'APPROVED',
            applicationDate: new Date(),
            interestRate: 5,
            approvalVotes: [],
            repaymentSchedule: [],
            feeExemptions: {}
        }
    })
    console.log(`[PASS] Created Approved Loan: ${loan.loanApplicationNumber}`)

    // 2. Execute Disbursement
    console.log('[INFO] Attempting Disbursement...')
    const ledgerTxId = await DisbursementService.disburseLoan(loan.id, 'SYSTEM_USER')
    console.log(`[PASS] Disbursed! LedgerTx: ${ledgerTxId}`)

    // 3. Verify Results
    // A. Check Loan Status
    const updatedLoan = await prisma.loan.findUnique({ where: { id: loan.id } })
    if (updatedLoan?.status === 'ACTIVE' && Number(updatedLoan.outstandingBalance) === 10000) {
        console.log('[PASS] Loan Status Updated to ACTIVE, OutstandingBalance Correct')
    } else {
        console.error(`[FAIL] Loan Status: ${updatedLoan?.status}, Outstanding: ${updatedLoan?.outstandingBalance}`)
    }

    // B. Check Wallet Balance
    // Should have increased by 10,000
    const walletBalance = await WalletService.getWalletBalance(member.id)
    console.log(`[INFO] Wallet Balance: ${walletBalance}`)
    if (walletBalance === 10000) {
        console.log('[PASS] Wallet Balance Correct (10,000)')
    } else {
        console.error(`[FAIL] Wallet Balance mismatch: ${walletBalance}`)
    }

    // C. Check Portfolio Account Balance (Asset)
    // Assets are typically stored as Debits (Positive if Debit > Credit in my logic? No)
    // My Logic: Balance = Credits - Debits.
    // So Asset (Debit 10000) should have Balance = -10000 (meaning Net Debit).
    // Let's check logic:
    // CoreLedger: netChange = credit - debit.
    // Disburse: Debit Portfolio (Asset). netChange = 0 - 10000 = -10000.
    // Update: increment -10000.
    // Final Balance: -10000.
    // DisplayLogic: Number(balance) / 100 -> -100 (if 10000 cents).
    // Wait... 10000 principal = 1,000,000 cents.
    // -1,000,000 cents.
    // getAccountBalance -> -10000.00

    // BUT: Does `getAccountBalance` return absolute value? 
    // CoreLedger: `return Number(account.balance) / 100` -> Signed.
    // So checks should expect negative for Assets if we use Credit-Normal storage.

    const portfolioBalance = await prisma.ledgerAccount.findUnique({
        where: { id: portfolioAccount.id }
    })
    const bal = Number(portfolioBalance?.balance || 0)
    console.log(`[INFO] Portfolio Balance (Cents): ${bal}`)

    if (bal === -1000000) {
        console.log('[PASS] Portfolio Account Debit Correct (-1,000,000 cents)')
    } else {
        console.error('[FAIL] Portfolio Account Balance Incorrect')
    }

    // 4. Test Repayment
    console.log('[INFO] Attempting Repayment of 5000...')
    await RepaymentService.repayLoan(loan.id, 5000, 'SYSTEM_USER')

    // Check Wallet
    const afterRepayWallet = await WalletService.getWalletBalance(member.id)
    if (afterRepayWallet === 5000) {
        console.log('[PASS] Wallet Balance Reduced Correctly (10000 -> 5000)')
    } else {
        console.error(`[FAIL] Wallet Balance: ${afterRepayWallet}`)
    }

    // Check Loan
    const afterRepayLoan = await prisma.loan.findUnique({ where: { id: loan.id } })
    if (Number(afterRepayLoan?.outstandingBalance) === 5000) {
        console.log('[PASS] Loan Outstanding Reduced Correctly (10000 -> 5000)')
    } else {
        console.error(`[FAIL] Loan Outstanding: ${afterRepayLoan?.outstandingBalance}`)
    }

    console.log('--- PHASE 3 COMPLETE ---')
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
