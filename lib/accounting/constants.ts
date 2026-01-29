import { SystemAccountType } from "@prisma/client"

// Default Mappings - Consolidated to 5 core accounts
export const DEFAULT_MAPPINGS: Record<SystemAccountType, string> = {
    // 5-Ledger System Codes:
    // 1000: ASSETS
    // 1200: RECIEVABLES
    // 2000: LIABILITIES
    // 3000: CONTRIBUTIONS
    // 4000: INCOME

    // Base Mappings
    CASH_ON_HAND: '1000',
    RECEIVABLES: '1200',
    MEMBER_WALLET: '2000',
    CONTRIBUTIONS: '3000',
    INCOME: '4000',

    // Asset / Wallet Events
    EVENT_EXPENSE_PAYMENT: '1000',           // Cash Out
    EVENT_CASH_DEPOSIT: '1000',              // Cash In
    EVENT_CASH_WITHDRAWAL: '1000',           // Cash Out
    EVENT_LOAN_DISBURSEMENT: '1000',         // Cash Out
    EVENT_LOAN_REPAYMENT_PRINCIPAL: '1200',  // Reduce Receivable
    EVENT_SHARE_CONTRIBUTION: '3000',        // Increase Contributions

    // Income Streams
    INCOME_LOAN_INTEREST: '4000',
    RECEIVABLE_LOAN_INTEREST: '1200',
    INCOME_LOAN_PENALTY: '4000',
    RECEIVABLE_LOAN_PENALTY: '1200',
    INCOME_LOAN_PROCESSING_FEE: '4000',
    INCOME_GENERAL_FEE: '4000',
    INCOME_REFINANCE_FEE: '4000',
    RECEIVABLE_LOAN_FEES: '1200'
}
