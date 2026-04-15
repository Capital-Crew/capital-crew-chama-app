
import {
    User as PrismaUser,
    Member as PrismaMember,
    Loan as PrismaLoan,
    LoanProduct as PrismaLoanProduct,
    AuditLog as PrismaAuditLog,
    Notification as PrismaNotification,
    Expense as PrismaExpense,
    Revenue as PrismaRevenue,
    ChargeTemplate as PrismaChargeTemplate,
    LoanStatus,
    ApprovalStatus,
    RepaymentFrequencyType,
    InterestType,
    InterestCalculationPeriodType,
    AmortizationType,
    ChargeType,
    ChargeCalculationType,
    UserRole,
    LoanNote as PrismaLoanNote,
    LoanNoteSubscription as PrismaLoanNoteSubscription,
    Group as PrismaGroup,
    GroupWallet as PrismaGroupWallet,
    GroupRiskConfig as PrismaGroupRiskConfig,
    GroupInvestmentProposal as PrismaGroupInvestmentProposal,
    GroupInvestmentProposalVote as PrismaGroupInvestmentProposalVote,
    LoanNotePaymentSchedule as PrismaLoanNotePaymentSchedule,
    Wallet as PrismaWallet,
    LedgerAccount as PrismaLedgerAccount
} from '@prisma/client';

// Re-export Enums for frontend use
export {
    LoanStatus, ApprovalStatus, RepaymentFrequencyType, InterestType,
    InterestCalculationPeriodType, AmortizationType, ChargeType,
    ChargeCalculationType, UserRole, ExpenseCategory,
    NotificationType, AuditLogAction, LedgerStatus, NormalBalance,
    AccountingPeriodStatus, TransactionStatus, RevenueCategory
} from '@prisma/client';

export enum AdjustmentCategory {
    PENALTY = 'PENALTY',
    LEGAL_FEE = 'LEGAL_FEE',
    BOUNCED_CHEQUE = 'BOUNCED_CHEQUE',
    RECOVERY_COST = 'RECOVERY_COST',
    SYSTEM_CORRECTION = 'SYSTEM_CORRECTION',
    WAIVER = 'WAIVER',
    INTEREST = 'INTEREST'
}

// JSON Types (Not managed by Prisma tables directly in this consolidation)
export enum RepaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    PARTIALLY_PAID = 'PARTIALLY_PAID'
}

export interface RepaymentScheduleItem {
    dueDate: string;
    principal: number;
    interest: number;
    total: number;
    status: RepaymentStatus | string;
}

export interface ApprovalVote {
    voterId: string;
    decision: ApprovalStatus;
    notes?: string;
    rejectionReason?: string;
    timestamp: string;
}

export interface FeeExemptions {
    applicationFee: boolean;
    rescheduleFee: boolean;
    topUpFee: boolean;
    penaltyFee: boolean;
}

export interface LoanCharge {
    id: string;
    name: string;
    loanProductId?: string;
    chargeType: ChargeType;
    calculationType: ChargeCalculationType;
    amount: number;
    dueDateOffset: number;
    isPenalty: boolean;
    isActive: boolean;
}

export interface UserPermissions {
    canViewAll: boolean;
    canAddData: boolean;
    canApprove: boolean;
    canManageSettings: boolean;
    canViewReports: boolean;
    canViewAudit: boolean;
    canManageUserRights: boolean;
    canExemptFees: boolean;
    canReverse: boolean;
    canEnrollMembers: boolean;
    canApproveMember: boolean;
    canActivateMember: boolean;
    canApproveLoanNotes: boolean;
    canManageLedger: boolean; // Added for Ledger Management

    // Granular Report Permissions
    canViewReportLoanDisbursement: boolean;
    canViewReportActivePortfolio: boolean;
    canViewReportPAR: boolean;
    canViewReportTrialBalance: boolean;
    canViewReportBalanceSheet: boolean;
    canViewReportRevenueStatement: boolean;
    canViewReportCashFlow: boolean;
    canViewReportProductProfitability: boolean;
    canViewReportFeeAnalysis: boolean;
    canViewReportNetInterestMargin: boolean;
}

// Extended Models
export interface User extends Omit<PrismaUser, 'permissions'> {
    permissions: UserPermissions;
    wallet?: Wallet;
}

export interface Loan extends Omit<PrismaLoan, 'repaymentSchedule' | 'approvalVotes' | 'feeExemptions' | 'productSnapshot' | 'applicationDate'> {
    repaymentSchedule: RepaymentScheduleItem[];
    approvalVotes: ApprovalVote[];
    feeExemptions: FeeExemptions;
    productSnapshot?: any;
    applicationDate: Date | string; // Handle date string/date obj
}

export interface LoanProduct extends Omit<PrismaLoanProduct, 'charges'> {
    charges: LoanCharge[];
}

export interface Member extends PrismaMember { }
export interface Notification extends PrismaNotification { }
export interface AuditLog extends PrismaAuditLog { }
export interface Expense extends PrismaExpense { }
export interface Revenue extends PrismaRevenue { }
export interface LedgerAccount extends PrismaLedgerAccount { }
export interface Wallet extends PrismaWallet { 
    glAccount?: LedgerAccount;
}

export interface LoanNote extends PrismaLoanNote {
    subscriptions?: LoanNoteSubscription[];
    paymentSchedule?: LoanNotePaymentSchedule[];
}

export interface LoanNoteSubscription extends PrismaLoanNoteSubscription {
    user?: User;
}

export interface Group extends PrismaGroup { 
    wallet?: GroupWallet;
    riskConfig?: GroupRiskConfig;
    investmentProposals?: GroupInvestmentProposal[];
}
export interface GroupWallet extends PrismaGroupWallet { 
    glAccount?: LedgerAccount;
}
export interface GroupRiskConfig extends PrismaGroupRiskConfig { }
export interface GroupInvestmentProposal extends PrismaGroupInvestmentProposal { 
    loanNote?: LoanNote;
    votes?: GroupInvestmentProposalVote[];
}
export interface GroupInvestmentProposalVote extends PrismaGroupInvestmentProposalVote { }
export interface LoanNotePaymentSchedule extends PrismaLoanNotePaymentSchedule { 
    loanNote?: LoanNote;
}

// Payment Gateway Types
export type DestinationType = 'LOAN_REPAYMENT' | 'CONTRIBUTION';

export interface PaymentAllocation {
    penalty: number;
    interest: number;
    principal: number;
    overpayment?: number;
}

export type Page = 'dashboard' | 'loans' | 'members' | 'expenses' | 'financials' | 'reports' | 'settings' | 'approvals' | 'notifications' | 'audit' | 'rights' | 'disbursements';

