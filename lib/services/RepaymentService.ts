import { db as prisma } from '@/lib/db'

export class RepaymentService {
    /**
     * Repay a loan using funds from the member's wallet.
     * @param loanId The ID of the loan to repay
     * @param amount The total repayment amount (Principal + Interest + Penalties)
     * @param userId The ID of the user performing the action
     */
    static async repayLoan(loanId: string, amount: number, userId: string): Promise<string> {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Fetch Loan & Product
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                include: { loanProduct: true }
            })
            if (!loan) throw new Error('Loan not found')
            if (!['ACTIVE', 'OVERDUE', 'DISBURSED', 'IN_ARREARS'].includes(loan.status)) {
                throw new Error(`Cannot repay loan in status: ${loan.status}`)
            }

            // 2. Resolve Wallet
            const wallet = await tx.wallet.findUnique({
                where: { memberId: loan.memberId }
            })
            if (!wallet) throw new Error('Member wallet not found')

            // 3. Check Wallet Balance using AccountingEngine
            const { AccountingEngine, getMemberWalletBalance, getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')

            const walletBalance = await getMemberWalletBalance(loan.memberId, tx)
            if (walletBalance < amount) {
                throw new Error(`Insufficient wallet funds. Available: ${walletBalance.toLocaleString()}, Required: ${amount.toLocaleString()}`)
            }

            // 4. Get Outstanding Balances & Waterfall
            const penaltyBalance = await getLoanPenaltyBalance(loan.id, tx)
            const interestBalance = await getLoanInterestBalance(loan.id, tx)
            let principalBalance = await getLoanPrincipalBalance(loan.id, tx)
            const feesBalance = await getLoanFeeBalance(loan.id, tx)

            // Fallback for Principal if ledger empty
            let totalOutstanding = penaltyBalance + interestBalance + principalBalance + feesBalance
            if (totalOutstanding <= 0) {
                // Safer to use Loan Model outstanding if ledger is 0
                principalBalance = Number(loan.outstandingBalance) || Number(loan.amount)
                totalOutstanding = principalBalance
            }

            if (amount > totalOutstanding) {
                // Optional: Allow overpayment? Current requirement says strict.
                // For now, strict.
                throw new Error(`Repayment amount exceeds outstanding balance (${totalOutstanding})`)
            }

            const { distributeRepayment } = await import('@/lib/finance/waterfall')
            const balances = { penalty: penaltyBalance, fees: feesBalance, interest: interestBalance, principal: principalBalance }
            const allocation = distributeRepayment(amount, balances)

            const { getSystemMappingsDict } = await import('@/app/actions/system-accounting')
            const mappings = await getSystemMappingsDict()

            const journalLines = []

            // Build Allocation Lines
            if (allocation.paidPenalty > 0) {
                journalLines.push({
                    accountCode: mappings.RECEIVABLE_LOAN_PENALTY,
                    debitAmount: 0,
                    creditAmount: allocation.paidPenalty,
                    description: 'Penalty Re-payment'
                })
            }
            if (allocation.paidFees > 0) {
                journalLines.push({
                    accountCode: mappings.RECEIVABLE_LOAN_FEES,
                    debitAmount: 0,
                    creditAmount: allocation.paidFees,
                    description: 'Fees Re-payment'
                })
            }
            if (allocation.paidInterest > 0) {
                journalLines.push({
                    accountCode: mappings.RECEIVABLE_LOAN_INTEREST,
                    debitAmount: 0,
                    creditAmount: allocation.paidInterest,
                    description: 'Interest Re-payment'
                })
            }
            if (allocation.paidPrincipal > 0) {
                journalLines.push({
                    accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL,
                    debitAmount: 0,
                    creditAmount: allocation.paidPrincipal,
                    description: 'Principal Re-payment'
                })
            }

            // Wallet Debit
            journalLines.push({
                accountId: wallet.glAccountId,
                debitAmount: amount,
                creditAmount: 0,
                description: 'Loan Repayment Withdrawal'
            })

            // 6. Post Journal Entry
            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_REPAYMENT',
                referenceId: loan.id,
                description: `Loan Repayment - ${loan.loanApplicationNumber}`,
                lines: journalLines,
                createdBy: userId,
                createdByName: 'Repayment Service' // Ideally fetch name
            }, tx)

            // 7. Update Loan Logic
            const newOutstanding = totalOutstanding - amount
            const newStatus = newOutstanding <= 0.01 ? 'CLEARED' : loan.status

            await tx.loan.update({
                where: { id: loanId },
                data: {
                    outstandingBalance: newOutstanding,
                    status: newStatus,
                    updatedAt: new Date()
                }
            })

            // 8. Loan Transaction (Strict)
            await tx.loanTransaction.create({
                data: {
                    loanId: loan.id,
                    type: 'REPAYMENT',
                    amount: amount,
                    postedAt: new Date(),
                    description: 'Loan Repayment via Wallet',
                    referenceId: journalEntry.id,
                    principalAmount: allocation.paidPrincipal,
                    interestAmount: allocation.paidInterest,
                    penaltyAmount: allocation.paidPenalty,
                    feeAmount: allocation.paidFees
                }
            })

            // 9. Wallet Transaction (Mirror)
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'REPAYMENT',
                    amount: amount,
                    description: `Repayment for ${loan.loanApplicationNumber}`,
                    relatedLoanId: loan.id,
                    balanceAfter: 0, // Ignored in new system
                    immutable: true
                }
            })

            return journalEntry.id
        })
    }
}
