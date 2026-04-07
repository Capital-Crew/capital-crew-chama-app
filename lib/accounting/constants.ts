import { SystemAccountType } from "@prisma/client"

// Default Mappings — aligned with full Chart of Accounts hierarchy
export const DEFAULT_MAPPINGS: Record<SystemAccountType, string> = {

    // Base Mappings
    CASH_ON_HAND: '1011', // Bank Account
    RECEIVABLES: '1021', // Principal Loans to Members
    MEMBER_WALLET: '3012', // Member Withdrawable Wallet
    CONTRIBUTIONS: '3011', // Member Contributions (Non-Withdrawable)
    REVENUE: '4011', // Interest on Loans (primary)

    // Asset / Wallet Events
    EVENT_EXPENSE_PAYMENT: '1011', // Cr Bank Account
    EVENT_CASH_DEPOSIT: '1011', // Dr Bank Account
    EVENT_CASH_WITHDRAWAL: '1011', // Cr Bank Account
    EVENT_LOAN_DISBURSEMENT: '3012', // Cr Member Withdrawable Wallet
    EVENT_LOAN_REPAYMENT_PRINCIPAL: '1021', // Cr Principal Loans to Members
    EVENT_CONTRIBUTION_PAYMENT: '3011', // Cr Member Contributions

    // Revenue Streams
    REVENUE_LOAN_INTEREST: '4011', // Interest on Loans
    RECEIVABLE_LOAN_INTEREST: '1022', // Interest Receivable
    REVENUE_LOAN_PENALTY: '4012', // Penalty Revenue
    RECEIVABLE_LOAN_PENALTY: '1023', // Penalty Receivable
    REVENUE_LOAN_PROCESSING_FEE: '4021', // Processing Fees
    REVENUE_GENERAL_FEE: '4021', // Processing Fees (general)
    REVENUE_REFINANCE_FEE: '4021', // Processing Fees (refinance)
    RECEIVABLE_LOAN_FEES: '1024', // Fees Receivable
    EVENT_MEETING_FINES: '4012', // Penalty Revenue
}
