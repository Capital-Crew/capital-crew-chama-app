
import {
    User as PrismaUser,
    Member as PrismaMember,
    Loan as PrismaLoan,
    LoanProduct as PrismaLoanProduct,
    AuditLog as PrismaAuditLog,
    Notification as PrismaNotification,
    Expense as PrismaExpense,
    Income as PrismaIncome,
    ChargeTemplate as PrismaChargeTemplate,
    LoanStatus,
    ApprovalStatus,
    RepaymentFrequencyType,
    InterestType,
    InterestCalculationPeriodType,
    AmortizationType,
    ChargeType,
    ChargeCalculationType,
    UserRole
} from '@prisma/client';

// Re-export Enums for frontend use
export {
    LoanStatus, ApprovalStatus, RepaymentFrequencyType, InterestType,
    InterestCalculationPeriodType, AmortizationType, ChargeType,
    ChargeCalculationType, UserRole, IncomeCategory, ExpenseCategory,
    NotificationType, AuditLogAction
} from '@prisma/client';

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
}

// Extended Models
export interface User extends Omit<PrismaUser, 'permissions'> {
    permissions: UserPermissions;
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
export interface Income extends PrismaIncome { }
export interface ChargeTemplate extends PrismaChargeTemplate { }

export type Page = 'dashboard' | 'loans' | 'members' | 'expenses' | 'financials' | 'reports' | 'settings' | 'approvals' | 'notifications' | 'audit' | 'rights' | 'disbursements';
