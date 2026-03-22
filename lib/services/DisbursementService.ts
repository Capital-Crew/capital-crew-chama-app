
import { db as prisma } from '@/lib/db'
import { CoreLedger } from '@/lib/accounting/CoreLedger'
import { WalletService } from './WalletService'
import { LoanTransactionType } from '@prisma/client'

export class DisbursementService {
    /**
     * Disburse a loan to the member's wallet.
     * Uses Double-Entry Accounting.
     */
    static async disburseLoan(loanId: string, userId: string): Promise<string> {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Fetch Loan & Product
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                include: { loanProduct: true }
            })

            if (!loan) throw new Error('Loan not found')
            if (loan.status !== 'APPROVED') throw new Error(`Cannot disburse loan in status: ${loan.status}`)
            if (loan.disbursedAmount > 0) throw new Error('Loan potentially already disbursed')

            // 2. Fetch Wallet
            const wallet = await tx.wallet.findUnique({
                where: { memberId: loan.memberId }
            })
            if (!wallet) throw new Error('Member wallet not found')
            if (wallet.status !== 'ACTIVE') throw new Error('Member wallet is not active')

            // 3. Fetch Product Accounting Mapping (LOAN_PORTFOLIO - Asset)
            const portfolioMapping = await tx.productAccountingMapping.findUnique({
                where: {
                    productId_accountType: {
                        productId: loan.loanProduct.id,
                        accountType: 'LOAN_PORTFOLIO'
                    }
                }
            })

            if (!portfolioMapping) {
                throw new Error(`Missing LOAN_PORTFOLIO mapping for product: ${loan.loanProduct.name}`)
            }

            const amountCents = BigInt(Math.round(Number(loan.amount) * 100))

            const ledgerTxId = await CoreLedger.postTransaction({
                transactionDate: new Date(),
                referenceType: 'LOAN_DISBURSEMENT',
                referenceId: loan.id,
                description: `Disbursement: ${loan.loanApplicationNumber}`,
                createdBy: userId,
                createdByName: 'System Disbursement',
                lines: [
                    { accountId: portfolioMapping.accountId, debit: amountCents, credit: BigInt(0) },
                    { accountId: wallet.glAccountId, debit: BigInt(0), credit: amountCents }
                ]
            })

            // 5. Update Loan Record
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'ACTIVE',
                    disbursementDate: new Date(),
                    outstandingBalance: loan.amount, // Changed from principal
                    updatedAt: new Date()
                }
            })

            // 6. Create Loan Transaction Record (For Statement View)
            await tx.loanTransaction.create({
                data: {
                    loanId: loan.id,
                    type: LoanTransactionType.DISBURSEMENT,
                    amount: loan.amount, // Changed from principal
                    postedAt: new Date(),
                    description: 'Loan Disbursement',
                    referenceId: ledgerTxId // Link to Ledger
                }
            })

            // 7. Create Wallet Transaction Record (For Wallet View)
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'LOAN_DISBURSEMENT',
                    amount: loan.amount, // Changed from principal
                    description: `Loan Disbursement: ${loan.loanApplicationNumber}`,
                    relatedLoanId: loan.id,
                    balanceAfter: 0, // Ignored (Derived)
                    immutable: true
                }
            })

            return ledgerTxId
        })
    }
}
