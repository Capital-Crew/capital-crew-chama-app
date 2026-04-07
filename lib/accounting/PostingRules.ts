import type { JournalEntryInput } from './AccountingEngine'
import { SystemAccountType } from '@prisma/client'

type SystemMapping = Record<SystemAccountType, string>

/**
 * Posting Rules for SACCO Transactions
 * Defines double-entry rules for each business event
 */
export class PostingRules {
    /**
     * LOAN DISBURSEMENT
     */
    static loanDisbursement(loan: {
        id: string
        loanApplicationNumber: string
        amount: number
        netDisbursementAmount: number
        processingFee: number
        insuranceFee: number
        contributionDeduction: number
        disbursementDate: Date
        memberId: string
    }, mappings: SystemMapping, createdBy: string, createdByName: string): JournalEntryInput {
        const lines = [
            {
                accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, // Asset
                debitAmount: loan.amount,
                creditAmount: 0,
                description: `Loan disbursed: ${loan.loanApplicationNumber}`
            }
        ]

        // Net amount to wallet
        if (loan.netDisbursementAmount > 0) {
            lines.push({
                accountCode: mappings.MEMBER_WALLET, // Liability
                debitAmount: 0,
                creditAmount: loan.netDisbursementAmount,
                description: 'Credited to member wallet'
            })
        }

        // Processing fee
        if (loan.processingFee > 0) {
            lines.push({
                accountCode: mappings.REVENUE_LOAN_PROCESSING_FEE, // Revenue
                debitAmount: 0,
                creditAmount: loan.processingFee,
                description: 'Processing fee earned'
            })
        }

        // Insurance fee
        if (loan.insuranceFee > 0) {
            lines.push({
                accountCode: mappings.REVENUE_GENERAL_FEE, // Revenue
                debitAmount: 0,
                creditAmount: loan.insuranceFee,
                description: 'Insurance fee earned'
            })
        }

        // Contribution boost
        if (loan.contributionDeduction > 0) {
            lines.push({
                accountCode: mappings.CONTRIBUTIONS, // Liability
                debitAmount: 0,
                creditAmount: loan.contributionDeduction,
                description: 'Contribution boost'
            })
        }

        return {
            transactionDate: loan.disbursementDate,
            referenceType: 'LOAN_DISBURSEMENT',
            referenceId: loan.id,
            description: `Loan disbursement: ${loan.loanApplicationNumber}`,
            notes: `Gross: ${loan.amount}, Net: ${loan.netDisbursementAmount}`,
            lines,
            createdBy,
            createdByName
        }
    }

    /**
     * LOAN REPAYMENT
     */
    static loanRepayment(
        loan: {
            id: string
            loanApplicationNumber: string
            memberId: string
        },
        allocation: {
            penalty: number
            interest: number
            principal: number
        },
        mappings: SystemMapping,
        repaymentDate: Date,
        createdBy: string,
        createdByName: string
    ): JournalEntryInput {
        const totalPayment = allocation.penalty + allocation.interest + allocation.principal
        const lines = [
            {
                accountCode: mappings.MEMBER_WALLET, // Liability
                debitAmount: totalPayment,
                creditAmount: 0,
                description: 'Payment from member wallet'
            }
        ]

        // Penalty portion
        if (allocation.penalty > 0) {
            lines.push({
                accountCode: mappings.RECEIVABLE_LOAN_PENALTY, // Asset
                debitAmount: 0,
                creditAmount: allocation.penalty,
                description: 'Penalty payment'
            })
        }

        // Interest portion
        if (allocation.interest > 0) {
            lines.push({
                accountCode: mappings.RECEIVABLE_LOAN_INTEREST, // Asset
                debitAmount: 0,
                creditAmount: allocation.interest,
                description: 'Interest payment'
            })
        }

        // Principal portion
        if (allocation.principal > 0) {
            lines.push({
                accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, // Asset
                debitAmount: 0,
                creditAmount: allocation.principal,
                description: 'Principal payment'
            })
        }

        return {
            transactionDate: repaymentDate,
            referenceType: 'LOAN_REPAYMENT',
            referenceId: loan.id,
            description: `Loan repayment: ${loan.loanApplicationNumber}`,
            notes: `Penalty: ${allocation.penalty}, Interest: ${allocation.interest}, Principal: ${allocation.principal}`,
            lines,
            createdBy,
            createdByName
        }
    }

    /**
     * INTEREST ACCRUAL
     */
    static interestAccrual(
        loan: {
            id: string
            loanApplicationNumber: string
        },
        amount: number,
        mappings: SystemMapping,
        accrualDate: Date,
        createdBy: string,
        createdByName: string
    ): JournalEntryInput {
        return {
            transactionDate: accrualDate,
            referenceType: 'LOAN_INTEREST_ACCRUAL',
            referenceId: loan.id,
            description: `Interest accrual: ${loan.loanApplicationNumber}`,
            notes: `Accrued interest: ${amount}`,
            lines: [
                {
                    accountCode: mappings.RECEIVABLE_LOAN_INTEREST, // Asset
                    debitAmount: amount,
                    creditAmount: 0,
                    description: 'Interest accrued'
                },
                {
                    accountCode: mappings.REVENUE_LOAN_INTEREST, // Revenue
                    debitAmount: 0,
                    creditAmount: amount,
                    description: 'Interest revenue earned'
                }
            ],
            createdBy,
            createdByName
        }
    }

    /**
     * PENALTY CHARGE
     */
    static penaltyCharge(
        loan: {
            id: string
            loanApplicationNumber: string
        },
        amount: number,
        mappings: SystemMapping,
        chargeDate: Date,
        reason: string,
        createdBy: string,
        createdByName: string
    ): JournalEntryInput {
        return {
            transactionDate: chargeDate,
            referenceType: 'LOAN_PENALTY_ACCRUAL',
            referenceId: loan.id,
            description: `Penalty charge: ${loan.loanApplicationNumber}`,
            notes: `Reason: ${reason}`,
            lines: [
                {
                    accountCode: mappings.RECEIVABLE_LOAN_PENALTY, // Asset
                    debitAmount: amount,
                    creditAmount: 0,
                    description: reason
                },
                {
                    accountCode: mappings.REVENUE_LOAN_PENALTY, // Revenue
                    debitAmount: 0,
                    creditAmount: amount,
                    description: 'Penalty revenue earned'
                }
            ],
            createdBy,
            createdByName
        }
    }

    /**
     * SAVINGS DEPOSIT
     */
    static savingsDeposit(
        memberId: string,
        memberName: string,
        amount: number,
        mappings: SystemMapping,
        depositDate: Date,
        createdBy: string,
        createdByName: string
    ): JournalEntryInput {
        return {
            transactionDate: depositDate,
            referenceType: 'SAVINGS_DEPOSIT',
            referenceId: memberId,
            description: `Deposit by ${memberName}`,
            lines: [
                {
                    accountCode: mappings.CASH_ON_HAND, // Asset
                    debitAmount: amount,
                    creditAmount: 0,
                    description: 'Cash received'
                },
                {
                    accountCode: mappings.MEMBER_WALLET, // Liability
                    debitAmount: 0,
                    creditAmount: amount,
                    description: `Credited to ${memberName}`
                }
            ],
            createdBy,
            createdByName
        }
    }

    /**
     * SAVINGS WITHDRAWAL
     */
    static savingsWithdrawal(
        memberId: string,
        memberName: string,
        amount: number,
        mappings: SystemMapping,
        withdrawalDate: Date,
        createdBy: string,
        createdByName: string
    ): JournalEntryInput {
        return {
            transactionDate: withdrawalDate,
            referenceType: 'SAVINGS_WITHDRAWAL',
            referenceId: memberId,
            description: `Withdrawal by ${memberName}`,
            lines: [
                {
                    accountCode: mappings.MEMBER_WALLET, // Liability
                    debitAmount: amount,
                    creditAmount: 0,
                    description: `Debited from ${memberName}`
                },
                {
                    accountCode: mappings.CASH_ON_HAND, // Asset
                    debitAmount: 0,
                    creditAmount: amount,
                    description: 'Cash paid out'
                }
            ],
            createdBy,
            createdByName
        }
    }

    /**
     * CONTRIBUTION PAYMENT
     */
    static contributionPayment(
        memberId: string,
        memberName: string,
        amount: number,
        mappings: SystemMapping,
        contributionDate: Date,
        createdBy: string,
        createdByName: string
    ): JournalEntryInput {
        return {
            transactionDate: contributionDate,
            referenceType: 'CONTRIBUTION_PAYMENT',
            referenceId: memberId,
            description: `Contribution by ${memberName}`,
            lines: [
                {
                    accountCode: mappings.CASH_ON_HAND, // Asset
                    debitAmount: amount,
                    creditAmount: 0,
                    description: 'Cash received'
                },
                {
                    accountCode: mappings.CONTRIBUTIONS, // Liability
                    debitAmount: 0,
                    creditAmount: amount,
                    description: `Contribution - ${memberName}`
                }
            ],
            createdBy,
            createdByName
        }
    }
}
