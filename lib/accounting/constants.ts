import { SystemAccountType } from "@prisma/client"

// Default Mappings — aligned with full Chart of Accounts hierarchy
export const DEFAULT_MAPPINGS: Record<SystemAccountType, string> = {
    // Full hierarchy codes:
    // 1011: Bank Account (Cash & Bank)
    // 1021: Principal Loans to Members
    // 1022: Interest Receivable
    // 1023: Penalty Receivable
    // 1024: Fees Receivable
    // 3011: Non-Withdrawable Deposits (Contributions)
    // 3012: Member Withdrawable Wallet
    // 4011: Interest on Loans
    // 4012: Interest on Penalties
    // 4021: Processing Fees

    // Base Mappings
    CASH_ON_HAND: '1011', // Bank Account
    RECEIVABLES: '1021', // Principal Loans to Members
    MEMBER_WALLET: '3012', // Member Withdrawable Wallet
    CONTRIBUTIONS: '3011', // Non-Withdrawable Deposits
    INCOME: '4011', // Interest on Loans (primary income)

    // Asset / Wallet Events
    EVENT_EXPENSE_PAYMENT: '1011', // Cr Bank Account
    EVENT_CASH_DEPOSIT: '1011', // Dr Bank Account
    EVENT_CASH_WITHDRAWAL: '1011', // Cr Bank Account
    EVENT_LOAN_DISBURSEMENT: '3012', // Cr Member Withdrawable Wallet
    EVENT_LOAN_REPAYMENT_PRINCIPAL: '1021', // Cr Principal Loans to Members
    EVENT_SHARE_CONTRIBUTION: '3011', // Cr Non-Withdrawable Deposits

    // Income Streams
    INCOME_LOAN_INTEREST: '4011', // Interest on Loans
    RECEIVABLE_LOAN_INTEREST: '1022', // Interest Receivable
    INCOME_LOAN_PENALTY: '4012', // Interest on Penalties
    RECEIVABLE_LOAN_PENALTY: '1023', // Penalty Receivable
    INCOME_LOAN_PROCESSING_FEE: '4021', // Processing Fees
    INCOME_GENERAL_FEE: '4021', // Processing Fees (general)
    INCOME_REFINANCE_FEE: '4021', // Processing Fees (refinance)
    RECEIVABLE_LOAN_FEES: '1024', // Fees Receivable
    EVENT_MEETING_FINES: '4012', // Interest on Penalties
}
