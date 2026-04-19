/**
 * Centralized Message Registry for Capital Crew
 * 
 * Standardizes user-facing feedback across the platform.
 * Use these constants instead of hardcoded strings to ensure consistent brand tone.
 */

export const MESSAGES = {
    AUTH: {
        UNAUTHORIZED: "Authentication required. Please sign in to access this feature.",
        ACCESS_DENIED: "Access Restricted: You lack the necessary permissions to perform this action.",
        FORBIDDEN: "Forbidden: You do not have the required administrative role for this operation.",
        OWNERSHIP_ONLY: "Access Denied: You are only authorized to manage your own records.",
        SYSTEM_ADMIN_ONLY: "Restricted Action: This feature is only accessible to System Administrators.",
    },
    
    GOVERNANCE: {
        REQ_NOT_FOUND: "The requested approval record could not be located.",
        FINALIZED: "Decision Locked: This request has already been finalized and cannot be modified.",
        ALREADY_VOTED: "Duplicate Vote: You have already recorded your decision for this stage.",
        SELF_APPROVAL: "Governance Rule: You cannot approve your own request to ensure independent oversight.",
        MISSING_PRIVILEGED_ROLE: (roles: string = "Board member") => 
            `Board Oversight Required: This transaction requires at least one signature from a ${roles} (Treasurer, Chairperson, or Secretary).`,
        INSUFFICIENT_QUORUM: (current: number, required: number) => 
            `Pending Quorum: Current approvals (${current}/${required}) are below the required threshold.`,
    },

    LOAN: {
        NOT_FOUND: "The requested loan application could not be found.",
        START_FAILED: "Initialization Error: Something went wrong while starting your loan application. Please try again or contact support.",
        ELIGIBILITY_ARREARS: (amount: string) => 
            `Eligibility Update: You currently have outstanding arrears of KES ${amount}. Please clear these to unlock new loan applications.`,
        ELIGIBILITY_MEMBERSHIP: (requiredMonths: number = 6) => 
            `Membership Rule: You must have been an active contributor for at least ${requiredMonths} months before you can apply for a loan.`,
        ELIGIBILITY_LIMIT: (requiredSavings: string, currentBalance: string) => 
            `Loan Limit Reached: Based on the 1/3 qualifying rule, you require minimum savings of KES ${requiredSavings}. Your current balance is KES ${currentBalance}.`,
        OUTSTANDING_LOAN: "Policy Restricted: Please clear all outstanding loan balances before applying for a new loan.",
        INVALID_AMOUNT: "Transaction Error: Please enter a loan amount greater than zero KES.",
        OVERPAYMENT: (amount: string, balance: string) => 
            `Overpayment Blocked: Your payment of KES ${amount} exceeds the outstanding balance (KES ${balance}). To clear the loan, please pay the exact balance.`,
        DISBURSE_DENIED: (status: string) => 
            `Disbursement Blocked: This loan is not yet eligible for funding. Current status: ${status}. Expected: APPROVED.`,
        NEGATIVE_DISBURSEMENT: "Financial Error: Disbursement blocked because deductions exceed the loan principal. Please review fee exemptions.",
    },

    NOTE: {
        NOT_FOUND: "The requested investment note could not be located.",
        NOT_OPEN: "Subscription Closed: This note is currently not open for new investments.",
        LIMIT_MIN: (min: string) => `Subscription Error: The minimum investment amount for this note is KES ${min}.`,
        LIMIT_MAX: (max: string) => `Subscription Error: The maximum investment amount for this note is KES ${max}.`,
        LIMIT_REMAINING: (rem: string) => `Subscription Error: Only KES ${rem} remains available for subscription.`,
        WALLET_NOT_FOUND: "Account Error: Your investment wallet or accounting mapping could not be found.",
        INSUFFICIENT_FUNDS: (bal: string) => `Insufficient Funds: Your current wallet balance is KES ${bal}. Please top up to continue.`,
        INVALID_STATE: "Process Error: The note is in an invalid state for this operation.",
        ISSUER_ONLY: "Access Denied: Only the Note Issuer (Floater) is authorized to perform this action.",
        ALREADY_SETTLED: "Process Error: This payment event has already been settled and finalized.",
        FUNDS_SHORTFALL: (req: string, avail: string) => `Funding Shortfall: Required KES ${req}, but only KES ${avail} is available in the issuer wallet.`,
    },

    EXPENSE: {
        NOT_FOUND: "The requested expense record could not be located.",
        INVALID_STATUS: (status: string) => `Process Error: Cannot execute this action on an expense with status: ${status}.`,
        WALLET_NOT_FOUND: "Finance Error: The Sacco Operating Wallet mapping is missing or invalid.",
        RECIPIENT_WALLET_NOT_FOUND: "Account Error: The recipient does not have an active wallet for payment.",
        ALREADY_PENDING: "Governance Error: An approval request is already active for this expense.",
        NO_WORKFLOW: "System Error: No active approval workflow was found for this expense record.",
    },

    MEMBER: {
        NOT_FOUND: "The requested member profile could not be located.",
        UPDATE_FAILED: "Process Error: Something went wrong while updating the profile. Please try again.",
        IMAGE_SIZE: "File Error: The uploaded image exceeds the 2MB size limit. Please use a smaller file.",
        IMAGE_UPLOAD_FAILED: "Sync Error: Failed to upload the profile image. Please check your connection and try again.",
        NO_USER_ACCOUNT: "Account Error: This member does not have an associated user login account.",
    },

    GENERAL: {
        DATABASE_ERROR: "Sync Error: We encountered a temporary issue while processing your request. Please try again shortly.",
        LOAD_FAILED: "Something went wrong while loading the data. Please refresh the page.",
    }
} as const;
