-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY', 'MEMBER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('APPLICATION', 'PENDING_APPROVAL', 'APPROVED', 'DISBURSED', 'ACTIVE', 'CLEARED', 'OVERDUE', 'REJECTED', 'CANCELLED', 'WRITTEN_OFF', 'DRAFT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepaymentFrequencyType" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('FLAT', 'DECLINING_BALANCE');

-- CreateEnum
CREATE TYPE "InterestCalculationPeriodType" AS ENUM ('DAILY', 'SAME_AS_REPAYMENT');

-- CreateEnum
CREATE TYPE "AmortizationType" AS ENUM ('EQUAL_INSTALLMENTS', 'EQUAL_PRINCIPAL');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('FEE', 'PENALTY');

-- CreateEnum
CREATE TYPE "ChargeCalculationType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('OFFICE', 'OPERATIONS', 'EVENTS', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('IMPREST', 'CLAIM', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "BalanceAction" AS ENUM ('REFUNDED_TO_SACCO', 'PAID_TO_USER');

-- CreateEnum
CREATE TYPE "BatchPaymentStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RevenueCategory" AS ENUM ('MONTHLY_CONTRIBUTION', 'LOAN_REPAYMENT', 'LOAN_PENALTY', 'NON_LOAN_PENALTY', 'RESCHEDULING_FEE', 'TOP_UP_FEE', 'APPLICATION_FEE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_RECEIVED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'LOAN_CLEARED', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('LOAN_APPLIED', 'LOAN_VOTE_CAST', 'LOAN_STATUS_CHANGED', 'EXPENSE_REQUEST_CREATED', 'MODIFICATION_REQUEST_CREATED', 'REQUEST_DECISION_MADE', 'FINANCIAL_RECORD_RECORDED', 'SETTINGS_UPDATED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'MEMBER_ADDED', 'MEMBER_STATUS_CHANGED', 'DASHBOARD_VIEWED', 'REPORT_DOWNLOADED', 'USER_RIGHTS_UPDATED', 'FEE_EXEMPTION_CHANGED', 'LOAN_APPLICATION_CANCELLED', 'LOAN_DISBURSED', 'CHARGE_TEMPLATE_CREATED', 'WALLET_TRANSACTION_CREATED', 'WALLET_TRANSACTION_REVERSED', 'WALLET_BALANCE_CHECKED', 'MIGRATION', 'BULK_MIGRATION', 'JOURNAL_REVERSAL', 'INTEREST_ENGINE_RUN', 'PENALTY_ENGINE_RUN', 'EXPENSE_REQUESTED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'MPESA_RECONCILED', 'LOAN_ADJUSTED', 'EXPENSE_PAID', 'LEDGER_CREATED', 'LEDGER_APPROVED', 'LEDGER_ACTIVATED', 'LEDGER_DEACTIVATED', 'LEDGER_CLOSED', 'PERIOD_CLOSED', 'PERIOD_REOPENED', 'WELFARE_REQUISITION_CREATED', 'WELFARE_STATUS_CHANGED', 'WELFARE_DISBURSED', 'WELFARE_TYPE_CREATED', 'WELFARE_TYPE_UPDATED', 'WELFARE_TYPE_DELETED', 'USER_LOGIN', 'USER_LOGOUT', 'MEETING_REPORT_SUBMITTED', 'MEETING_ATTENDANCE_PROCESSED', 'MEETING_CREATED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILURE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARN', 'CRITICAL');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CONTRIBUTION', 'DEPOSIT', 'LOAN_DISBURSEMENT', 'REPAYMENT', 'FEE', 'PENALTY', 'SHARE_PURCHASE', 'WITHDRAWAL', 'REVERSAL', 'REFUND', 'ADJUSTMENT', 'EXPENSE_PAYOUT', 'IMPREST_ADVANCE', 'IMPREST_REFUND', 'DIVIDEND_PAYOUT');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('SHARE_CONTRIBUTION', 'SHARE_REVERSAL', 'CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'FEE_CHARGE', 'FEE_REVERSAL', 'CREDIT');

-- CreateEnum
CREATE TYPE "LoanEventType" AS ENUM ('APPLICATION_SUBMITTED', 'APPROVAL_RECEIVED', 'APPROVAL_REJECTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'REPAYMENT_MADE', 'PENALTY_APPLIED', 'LOAN_CLEARED', 'LOAN_RESCHEDULED', 'LOAN_TOPPED_UP');

-- CreateEnum
CREATE TYPE "ContributionTransactionType" AS ENUM ('CONTRIBUTION', 'REVERSAL');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLOSED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "AccountingPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_INTEREST_ACCRUAL', 'LOAN_PENALTY_ACCRUAL', 'LOAN_FEE_CHARGE', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'CONTRIBUTION_PAYMENT', 'CONTRIBUTION_REVERSAL', 'MANUAL_ADJUSTMENT', 'OPENING_BALANCE', 'MIGRATION', 'REVERSAL', 'WELFARE_DISBURSEMENT', 'EXPENSE_PAYOUT', 'CONTRIBUTION_PENALTY_ACCRUAL', 'BULK_PAYOUT', 'PENALTY', 'MEETING_FINES');

-- CreateEnum
CREATE TYPE "AggregateType" AS ENUM ('LOAN', 'MEMBER', 'WALLET', 'CONTRIBUTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DomainEventType" AS ENUM ('LOAN_APPLIED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'REPAYMENT_MADE', 'LOAN_CLEARED', 'LOAN_RESCHEDULED', 'LOAN_TOPPED_UP', 'PENALTY_APPLIED', 'MEMBER_REGISTERED', 'MEMBER_UPDATED', 'MEMBER_DEACTIVATED', 'WALLET_CREATED', 'WALLET_DEPOSIT_MADE', 'WALLET_WITHDRAWAL_MADE', 'CONTRIBUTION_MADE', 'CONTRIBUTION_REVERSED', 'SYSTEM_MIGRATION', 'SYSTEM_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD');

-- CreateEnum
CREATE TYPE "CommandResourceType" AS ENUM ('MEMBER', 'LOAN');

-- CreateEnum
CREATE TYPE "LoanHistoryAction" AS ENUM ('SUBMITTED', 'CANCELLED', 'VOTED_APPROVE', 'VOTED_REJECT', 'MODIFIED');

-- CreateEnum
CREATE TYPE "InterestPostingType" AS ENUM ('DISBURSEMENT_ACCRUAL', 'MONTHLY_ACCRUAL');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'DISBURSED', 'SURRENDERED', 'CLOSED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'APOLOGY', 'APOLOGY_APPROVED', 'APOLOGY_REJECTED');

-- CreateEnum
CREATE TYPE "ApologyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttendanceFineStatus" AS ENUM ('PENDING', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "NextOfKinRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "PenaltyStatus" AS ENUM ('NONE', 'PENDING', 'APPLIED');

-- CreateEnum
CREATE TYPE "ProductAccountingType" AS ENUM ('INTEREST_REVENUE', 'FEE_REVENUE', 'PENALTY_REVENUE', 'LOAN_PORTFOLIO', 'INTEREST_RECEIVABLE', 'PENALTY_RECEIVABLE', 'FUND_SOURCE');

-- CreateEnum
CREATE TYPE "SystemAccountType" AS ENUM ('EVENT_EXPENSE_PAYMENT', 'EVENT_CASH_DEPOSIT', 'EVENT_CASH_WITHDRAWAL', 'EVENT_LOAN_DISBURSEMENT', 'EVENT_LOAN_REPAYMENT_PRINCIPAL', 'EVENT_CONTRIBUTION_PAYMENT', 'REVENUE_LOAN_INTEREST', 'RECEIVABLE_LOAN_INTEREST', 'REVENUE_LOAN_PENALTY', 'RECEIVABLE_LOAN_PENALTY', 'REVENUE_LOAN_PROCESSING_FEE', 'REVENUE_GENERAL_FEE', 'REVENUE_REFINANCE_FEE', 'RECEIVABLE_LOAN_FEES', 'EVENT_MEETING_FINES', 'CASH_ON_HAND', 'RECEIVABLES', 'MEMBER_WALLET', 'CONTRIBUTIONS', 'REVENUE');

-- CreateEnum
CREATE TYPE "LoanTransactionType" AS ENUM ('DISBURSEMENT', 'REPAYMENT', 'INTEREST', 'PENALTY', 'WAIVER', 'REVERSAL');

-- CreateEnum
CREATE TYPE "MonthlyTrackerStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "WelfareStatus" AS ENUM ('PENDING', 'APPROVED', 'DISBURSED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WelfareEventType" AS ENUM ('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('LOAN', 'EXPENSE', 'MEMBER', 'WELFARE', 'OTHER');

-- CreateEnum
CREATE TYPE "MpesaTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('LOAN', 'MEMBER', 'EXPENSE', 'WELFARE', 'ACCOUNT_TRANSFER');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'CANCELLED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT');

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "subType" TEXT,
    "balance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "LedgerStatus" NOT NULL DEFAULT 'ACTIVE',
    "normalBalance" "NormalBalance" NOT NULL DEFAULT 'DEBIT',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "isSystemAccount" BOOLEAN NOT NULL DEFAULT false,
    "isManualPostingAllowed" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "activatedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "allowManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPeriod" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AccountingPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceType" "ReferenceType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversalOf" TEXT,
    "totalAmount" DECIMAL(19,4) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT DEFAULT '',
    "postedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED',
    "accountingPeriodId" TEXT,
    "externalReferenceId" TEXT,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "ledgerAccountId" TEXT NOT NULL,
    "debitAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "key" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response" JSONB,
    "locked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "memberId" TEXT,
    "image" TEXT,
    "avatarPreset" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" INTEGER NOT NULL,
    "externalId" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "beneficiaries" JSONB,
    "canApproveLoan" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT,
    "contributionBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "contributionArrears" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "penaltyArrears" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDetail" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT,
    "occupation" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberContact" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "phone" TEXT,
    "physicalAddress" TEXT,
    "postalAddress" TEXT,
    "city" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberIdentifier" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandLog" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" "CommandResourceType" NOT NULL,
    "action" TEXT NOT NULL,
    "payloadBefore" JSONB,
    "payloadAfter" JSONB,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuarantorMap" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "guarantorId" TEXT NOT NULL,
    "amountGuaranteed" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuarantorMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL DEFAULT 'LP',
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "principal" DECIMAL(19,4) NOT NULL,
    "minPrincipal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "maxPrincipal" DECIMAL(19,4) NOT NULL DEFAULT 1000000,
    "numberOfRepayments" INTEGER NOT NULL,
    "minRepaymentTerms" INTEGER NOT NULL DEFAULT 1,
    "maxRepaymentTerms" INTEGER NOT NULL DEFAULT 12,
    "repaymentEvery" INTEGER NOT NULL,
    "repaymentFrequencyType" "RepaymentFrequencyType" NOT NULL,
    "interestRatePerPeriod" DECIMAL(10,6) NOT NULL,
    "interestType" "InterestType" NOT NULL,
    "interestCalculationPeriodType" "InterestCalculationPeriodType" NOT NULL,
    "amortizationType" "AmortizationType" NOT NULL,
    "defaultPenaltyRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gracePeriod" INTEGER NOT NULL DEFAULT 0,
    "charges" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "loanApplicationNumber" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "loanProductId" TEXT,
    "amount" DECIMAL(19,4),
    "applicationDate" TIMESTAMP(3),
    "disbursementDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "interestRate" DECIMAL(10,6),
    "penalties" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "memberContributionsAtApplication" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "grossQualifyingAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "processingFee" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "insuranceFee" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "contributionDeduction" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "existingLoanOffset" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "netDisbursementAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "approvalVotes" JSONB NOT NULL,
    "repaymentSchedule" JSONB,
    "originalRepaymentSchedule" JSONB,
    "cachedSchedule" JSONB,
    "feeExemptions" JSONB,
    "productSnapshot" JSONB,
    "loanContract" TEXT,
    "applicationFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "hasBeenRescheduled" BOOLEAN NOT NULL DEFAULT false,
    "hasBeenToppedUp" BOOLEAN NOT NULL DEFAULT false,
    "penaltyRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "installments" INTEGER NOT NULL DEFAULT 12,
    "monthlyInstallment" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "interestRatePerMonth" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastInterestRunDate" TIMESTAMP(3),
    "nextInterestRunDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accruedInterestTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancellationCount" INTEGER NOT NULL DEFAULT 0,
    "submissionVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loanType" TEXT,
    "step" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanHistory" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" "LoanHistoryAction" NOT NULL,
    "version" INTEGER NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestPosting" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "type" "InterestPostingType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT,

    CONSTRAINT "InterestPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanTopUp" (
    "id" TEXT NOT NULL,
    "newLoanId" TEXT NOT NULL,
    "oldLoanId" TEXT NOT NULL,
    "oldLoanNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "principalBalance" DECIMAL(19,4) NOT NULL,
    "accruedInterest" DECIMAL(19,4) NOT NULL,
    "penalties" DECIMAL(19,4) NOT NULL,
    "refinanceFee" DECIMAL(19,4) NOT NULL,
    "totalOffset" DECIMAL(19,4) NOT NULL,
    "offsetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanTopUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chargeType" "ChargeType" NOT NULL,
    "calculationType" "ChargeCalculationType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "dueDateOffset" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChargeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL DEFAULT 'OPERATIONAL',
    "requestedAmount" DECIMAL(19,4) NOT NULL,
    "approvedAmount" DECIMAL(19,4),
    "actualAmount" DECIMAL(19,4),
    "amount" DECIMAL(19,4) NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "expenseAccountId" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "surrenderDate" TIMESTAMP(3),
    "balanceAction" "BalanceAction",
    "category" "ExpenseCategory",
    "subCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategoryGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategoryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchPayment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(19,4) NOT NULL,
    "status" "BatchPaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "walletTransactionId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "ledgerEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferApproval" (
    "id" TEXT NOT NULL,
    "transferRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseApproval" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "category" "RevenueCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "loanId" TEXT,
    "transactionId" TEXT NOT NULL,
    "principalAmount" DECIMAL(19,4),
    "interestAmount" DECIMAL(19,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loanId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userRole" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "geolocation" TEXT,
    "action" "AuditLogAction" NOT NULL,
    "actionType" "AuditLogAction",
    "domain" TEXT,
    "details" TEXT,
    "summary" TEXT,
    "context" TEXT,
    "entityType" TEXT DEFAULT 'unknown',
    "entityId" TEXT DEFAULT 'unknown',
    "requestId" TEXT,
    "apiRoute" TEXT,
    "httpMethod" TEXT DEFAULT 'POST',
    "status" "AuditStatus" DEFAULT 'SUCCESS',
    "severity" TEXT,
    "severityLevel" "Severity" DEFAULT 'INFO',
    "errorCode" TEXT,
    "errorStack" TEXT,
    "durationMs" INTEGER,
    "steps" JSONB,
    "snapshot" JSONB,
    "metadata" JSONB,
    "stateBefore" JSONB,
    "stateAfter" JSONB,
    "diff" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReversalLog" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReversalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionTransaction" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "walletId" TEXT,
    "type" "ContributionTransactionType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT DEFAULT '',
    "creatorName" TEXT DEFAULT '',
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalId" TEXT,
    "reverses" TEXT,
    "ledgerTransactionId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ContributionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "accountRef" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "description" TEXT NOT NULL,
    "relatedLoanId" TEXT,
    "balanceAfter" DECIMAL(19,4) NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reverses" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralLedger" (
    "id" TEXT NOT NULL,
    "transactionType" "LedgerTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "debitAccount" TEXT DEFAULT '',
    "creditAccount" TEXT DEFAULT '',
    "walletTransactionId" TEXT,
    "contributionTransactionId" TEXT,
    "loanId" TEXT,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT DEFAULT '',
    "creatorName" TEXT DEFAULT '',
    "metadata" JSONB,

    CONSTRAINT "GeneralLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaccoSettings" (
    "id" TEXT NOT NULL,
    "loanMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 3.0,
    "processingFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "insuranceFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "contributionBoost" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 3,
    "refinanceFeePercentage" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "allowLoanTopUp" BOOLEAN NOT NULL DEFAULT true,
    "rescheduleFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "penaltyRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "requiredApprovalsReschedule" INTEGER NOT NULL DEFAULT 3,
    "requiredApprovalsTopUp" INTEGER NOT NULL DEFAULT 3,
    "requiredWelfareApprovals" INTEGER NOT NULL DEFAULT 2,
    "welfareMonthlyContribution" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "welfareCurrentBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monthlyContributionAmount" DECIMAL(19,4) NOT NULL DEFAULT 2000,
    "latePaymentPenalty" DECIMAL(19,4) NOT NULL DEFAULT 200,
    "penaltyAbsentAmount" DECIMAL(19,4) NOT NULL DEFAULT 500,
    "penaltyLateAmount" DECIMAL(19,4) NOT NULL DEFAULT 200,
    "meetingFeesGlId" TEXT,
    "meetingReceivableGlId" TEXT,

    CONSTRAINT "SaccoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "minutesUrl" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isPenaltiesProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "minutesLate" INTEGER DEFAULT 0,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apology" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApologyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceFine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AttendanceFineStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceFine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApproval" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LoanApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestEngineRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "affectedLoanCount" INTEGER NOT NULL DEFAULT 0,
    "totalInterest" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "error" TEXT,
    "loanId" TEXT,

    CONSTRAINT "InterestEngineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanJourneyEvent" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "eventType" "LoanEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanJourneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" "AggregateType" NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" "DomainEventType" NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "causationId" TEXT,
    "correlationId" TEXT,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanSummaryProjection" (
    "loanId" TEXT NOT NULL,
    "totalDisbursed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRepaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disbursementDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "lastEventId" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanSummaryProjection_pkey" PRIMARY KEY ("loanId")
);

-- CreateTable
CREATE TABLE "MemberBalanceProjection" (
    "memberId" TEXT NOT NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLoansActive" INTEGER NOT NULL DEFAULT 0,
    "totalLoansDisbursed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLoansOutstanding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastEventId" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberBalanceProjection_pkey" PRIMARY KEY ("memberId")
);

-- CreateTable
CREATE TABLE "NextOfKin" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "altPhone" TEXT,
    "allocation" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NextOfKin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAccountingMapping" (
    "id" TEXT NOT NULL,
    "type" "SystemAccountType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAccountingMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAccountingMapping" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountType" "ProductAccountingType" NOT NULL,

    CONSTRAINT "ProductAccountingMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanTransaction" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "runId" TEXT,
    "type" "LoanTransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "principalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feeAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overpaymentPortion" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalPrincipalOutstanding" DECIMAL(19,4) NOT NULL,
    "totalInterestReceivable" DECIMAL(19,4) NOT NULL,
    "totalPenaltyReceivable" DECIMAL(19,4) NOT NULL,
    "disbursementVolume" DECIMAL(19,4) NOT NULL,
    "repaymentVolume" DECIMAL(19,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingMapping" (
    "id" TEXT NOT NULL,
    "reportLine" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,

    CONSTRAINT "ReportingMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentInstallment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalDue" DECIMAL(15,2) NOT NULL,
    "interestDue" DECIMAL(15,2) NOT NULL,
    "penaltyDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feeDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "principalPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penaltyPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feesPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isFullyPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyTracker" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "required" DECIMAL(19,4) NOT NULL,
    "paid" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "balance" DECIMAL(19,4) NOT NULL,
    "status" "MonthlyTrackerStatus" NOT NULL DEFAULT 'PENDING',
    "isPenalized" BOOLEAN NOT NULL DEFAULT false,
    "penaltyApplied" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scheduledAmount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL,
    "fineEnabled" BOOLEAN NOT NULL DEFAULT true,
    "flatFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "scheduledAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "MonthlyTrackerStatus" NOT NULL DEFAULT 'PENDING',
    "flatFeeApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyRateApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineStartDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FineSnapshot" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "daysPastDue" INTEGER NOT NULL,
    "flatFee" DOUBLE PRECISION NOT NULL,
    "dailyPenalty" DOUBLE PRECISION NOT NULL,
    "totalFine" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FineSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "glAccountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareCustomField" (
    "id" TEXT NOT NULL,
    "welfareTypeId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareRequisition" (
    "id" TEXT NOT NULL,
    "requisitionNumber" TEXT NOT NULL,
    "welfareTypeId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "beneficiaryName" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "customFieldData" JSONB,
    "status" "WelfareStatus" NOT NULL DEFAULT 'PENDING',
    "disbursedAt" TIMESTAMP(3),
    "journalEntryId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareApproval" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WelfareApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareJourneyEvent" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "eventType" "WelfareEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WelfareJourneyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareFundTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "description" TEXT NOT NULL,
    "balanceAfter" DECIMAL(19,4) NOT NULL,
    "requisitionId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT DEFAULT '',
    "externalReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WelfareFundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "emails" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceTable" TEXT NOT NULL,
    "requesterId" TEXT,
    "requesterName" TEXT,
    "description" TEXT,
    "amount" DECIMAL(19,4),
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requiredPermission" TEXT,
    "approverId" TEXT,
    "approverName" TEXT,
    "decisionNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "status" "MpesaTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutRequestId" TEXT NOT NULL,
    "mpesaReceiptNumber" TEXT,
    "failureReason" TEXT,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profilePhone" TEXT NOT NULL,
    "payingPhone" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ncbaReference" TEXT,
    "callbackReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorUsername" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "ApprovalAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDelegation" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "entityType" "EntityType",
    "entityId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "requiredRole" "UserRole" NOT NULL,
    "canReject" BOOLEAN NOT NULL DEFAULT true,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "minVotesRequired" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRequest" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "currentStageId" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAction" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemModule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailNotificationLog" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "EmailNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_code_idx" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_type_idx" ON "LedgerAccount"("type");

-- CreateIndex
CREATE INDEX "LedgerAccount_parentId_idx" ON "LedgerAccount"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPeriod_startDate_endDate_key" ON "AccountingPeriod"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_reversalOf_key" ON "LedgerTransaction"("reversalOf");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_externalReferenceId_key" ON "LedgerTransaction"("externalReferenceId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_referenceType_referenceId_idx" ON "LedgerTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_transactionDate_idx" ON "LedgerTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "LedgerTransaction_createdAt_idx" ON "LedgerTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerTransaction_externalReferenceId_idx" ON "LedgerTransaction"("externalReferenceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_ledgerTransactionId_idx" ON "LedgerEntry"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_ledgerAccountId_idx" ON "LedgerEntry"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "idempotency_records_path_createdAt_idx" ON "idempotency_records"("path", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Member_externalId_key" ON "Member"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberDetail_memberId_key" ON "MemberDetail"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberContact_memberId_key" ON "MemberContact"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberContact_mobile_key" ON "MemberContact"("mobile");

-- CreateIndex
CREATE INDEX "MemberIdentifier_memberId_idx" ON "MemberIdentifier"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberIdentifier_type_value_key" ON "MemberIdentifier"("type", "value");

-- CreateIndex
CREATE INDEX "CommandLog_resourceId_idx" ON "CommandLog"("resourceId");

-- CreateIndex
CREATE INDEX "CommandLog_performedBy_idx" ON "CommandLog"("performedBy");

-- CreateIndex
CREATE INDEX "CommandLog_timestamp_idx" ON "CommandLog"("timestamp");

-- CreateIndex
CREATE INDEX "GuarantorMap_loanId_idx" ON "GuarantorMap"("loanId");

-- CreateIndex
CREATE INDEX "GuarantorMap_guarantorId_idx" ON "GuarantorMap"("guarantorId");

-- CreateIndex
CREATE UNIQUE INDEX "GuarantorMap_loanId_guarantorId_key" ON "GuarantorMap"("loanId", "guarantorId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_shortCode_key" ON "LoanProduct"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanApplicationNumber_key" ON "Loan"("loanApplicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoanDraft_userId_key" ON "LoanDraft"("userId");

-- CreateIndex
CREATE INDEX "LoanDraft_userId_idx" ON "LoanDraft"("userId");

-- CreateIndex
CREATE INDEX "LoanDraft_updatedAt_idx" ON "LoanDraft"("updatedAt");

-- CreateIndex
CREATE INDEX "LoanHistory_loanId_idx" ON "LoanHistory"("loanId");

-- CreateIndex
CREATE INDEX "InterestPosting_loanId_idx" ON "InterestPosting"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestPosting_loanId_periodMonth_periodYear_type_key" ON "InterestPosting"("loanId", "periodMonth", "periodYear", "type");

-- CreateIndex
CREATE INDEX "LoanTopUp_newLoanId_idx" ON "LoanTopUp"("newLoanId");

-- CreateIndex
CREATE INDEX "LoanTopUp_oldLoanId_idx" ON "LoanTopUp"("oldLoanId");

-- CreateIndex
CREATE INDEX "Expense_requesterId_idx" ON "Expense"("requesterId");

-- CreateIndex
CREATE INDEX "Expense_expenseAccountId_idx" ON "Expense"("expenseAccountId");

-- CreateIndex
CREATE INDEX "Expense_subCategoryId_idx" ON "Expense"("subCategoryId");

-- CreateIndex
CREATE INDEX "Expense_recipientId_idx" ON "Expense"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategoryGroup_name_key" ON "ExpenseCategoryGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategoryGroup_slug_key" ON "ExpenseCategoryGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSubCategory_slug_key" ON "ExpenseSubCategory"("slug");

-- CreateIndex
CREATE INDEX "ExpenseSubCategory_groupId_idx" ON "ExpenseSubCategory"("groupId");

-- CreateIndex
CREATE INDEX "BatchItem_batchId_idx" ON "BatchItem"("batchId");

-- CreateIndex
CREATE INDEX "BatchItem_memberId_idx" ON "BatchItem"("memberId");

-- CreateIndex
CREATE INDEX "TransferRequest_requesterId_idx" ON "TransferRequest"("requesterId");

-- CreateIndex
CREATE INDEX "TransferRequest_status_idx" ON "TransferRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TransferApproval_transferRequestId_approverId_key" ON "TransferApproval"("transferRequestId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseApproval_expenseId_userId_key" ON "ExpenseApproval"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_entityType_idx" ON "AuditLog"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_sessionId_idx" ON "AuditLog"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_context_idx" ON "AuditLog"("context");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionTransaction_reversalId_key" ON "ContributionTransaction"("reversalId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionTransaction_reverses_key" ON "ContributionTransaction"("reverses");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionTransaction_ledgerTransactionId_key" ON "ContributionTransaction"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "ContributionTransaction_memberId_createdAt_idx" ON "ContributionTransaction"("memberId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_memberId_key" ON "Wallet"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_accountRef_key" ON "Wallet"("accountRef");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralLedger_walletTransactionId_key" ON "GeneralLedger"("walletTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralLedger_contributionTransactionId_key" ON "GeneralLedger"("contributionTransactionId");

-- CreateIndex
CREATE INDEX "GeneralLedger_memberId_createdAt_idx" ON "GeneralLedger"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneralLedger_transactionType_createdAt_idx" ON "GeneralLedger"("transactionType", "createdAt");

-- CreateIndex
CREATE INDEX "MeetingAttendee_memberId_idx" ON "MeetingAttendee"("memberId");

-- CreateIndex
CREATE INDEX "MeetingAttendee_meetingId_idx" ON "MeetingAttendee"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendee_meetingId_memberId_key" ON "MeetingAttendee"("meetingId", "memberId");

-- CreateIndex
CREATE INDEX "Apology_meetingId_idx" ON "Apology"("meetingId");

-- CreateIndex
CREATE INDEX "Apology_userId_idx" ON "Apology"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Apology_meetingId_userId_key" ON "Apology"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "AttendanceFine_userId_idx" ON "AttendanceFine"("userId");

-- CreateIndex
CREATE INDEX "AttendanceFine_status_idx" ON "AttendanceFine"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceFine_meetingId_userId_key" ON "AttendanceFine"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "LoanApproval_loanId_idx" ON "LoanApproval"("loanId");

-- CreateIndex
CREATE INDEX "LoanApproval_approverId_idx" ON "LoanApproval"("approverId");

-- CreateIndex
CREATE INDEX "InterestEngineRun_status_idx" ON "InterestEngineRun"("status");

-- CreateIndex
CREATE INDEX "InterestEngineRun_startedAt_idx" ON "InterestEngineRun"("startedAt");

-- CreateIndex
CREATE INDEX "LoanJourneyEvent_loanId_idx" ON "LoanJourneyEvent"("loanId");

-- CreateIndex
CREATE INDEX "DomainEvent_aggregateType_aggregateId_idx" ON "DomainEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "DomainEvent_eventType_idx" ON "DomainEvent"("eventType");

-- CreateIndex
CREATE INDEX "DomainEvent_timestamp_idx" ON "DomainEvent"("timestamp");

-- CreateIndex
CREATE INDEX "DomainEvent_aggregateType_aggregateId_timestamp_idx" ON "DomainEvent"("aggregateType", "aggregateId", "timestamp");

-- CreateIndex
CREATE INDEX "DomainEvent_correlationId_idx" ON "DomainEvent"("correlationId");

-- CreateIndex
CREATE INDEX "LoanSummaryProjection_status_idx" ON "LoanSummaryProjection"("status");

-- CreateIndex
CREATE INDEX "LoanSummaryProjection_nextDueDate_idx" ON "LoanSummaryProjection"("nextDueDate");

-- CreateIndex
CREATE INDEX "MemberBalanceProjection_lastUpdated_idx" ON "MemberBalanceProjection"("lastUpdated");

-- CreateIndex
CREATE INDEX "NextOfKin_memberId_idx" ON "NextOfKin"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemAccountingMapping_type_key" ON "SystemAccountingMapping"("type");

-- CreateIndex
CREATE INDEX "SystemAccountingMapping_accountId_idx" ON "SystemAccountingMapping"("accountId");

-- CreateIndex
CREATE INDEX "ProductAccountingMapping_productId_idx" ON "ProductAccountingMapping"("productId");

-- CreateIndex
CREATE INDEX "ProductAccountingMapping_accountId_idx" ON "ProductAccountingMapping"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAccountingMapping_productId_accountType_key" ON "ProductAccountingMapping"("productId", "accountType");

-- CreateIndex
CREATE INDEX "LoanTransaction_loanId_isReversed_idx" ON "LoanTransaction"("loanId", "isReversed");

-- CreateIndex
CREATE INDEX "LoanTransaction_createdAt_idx" ON "LoanTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LoanTransaction_postedAt_idx" ON "LoanTransaction"("postedAt");

-- CreateIndex
CREATE INDEX "LoanTransaction_transactionDate_idx" ON "LoanTransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_date_key" ON "DailySummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingMapping_reportLine_accountCode_key" ON "ReportingMapping"("reportLine", "accountCode");

-- CreateIndex
CREATE INDEX "RepaymentInstallment_loanId_idx" ON "RepaymentInstallment"("loanId");

-- CreateIndex
CREATE INDEX "RepaymentInstallment_dueDate_idx" ON "RepaymentInstallment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RepaymentInstallment_loanId_installmentNumber_key" ON "RepaymentInstallment"("loanId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE INDEX "MonthlyTracker_memberId_idx" ON "MonthlyTracker"("memberId");

-- CreateIndex
CREATE INDEX "MonthlyTracker_status_idx" ON "MonthlyTracker"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTracker_memberId_month_year_key" ON "MonthlyTracker"("memberId", "month", "year");

-- CreateIndex
CREATE INDEX "Contribution_status_dueDate_idx" ON "Contribution"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Contribution_memberId_dueDate_idx" ON "Contribution"("memberId", "dueDate");

-- CreateIndex
CREATE INDEX "FineSnapshot_contributionId_idx" ON "FineSnapshot"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "FineSnapshot_contributionId_snapshotDate_key" ON "FineSnapshot"("contributionId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareType_name_key" ON "WelfareType"("name");

-- CreateIndex
CREATE INDEX "WelfareType_glAccountId_idx" ON "WelfareType"("glAccountId");

-- CreateIndex
CREATE INDEX "WelfareCustomField_welfareTypeId_idx" ON "WelfareCustomField"("welfareTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareRequisition_requisitionNumber_key" ON "WelfareRequisition"("requisitionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareRequisition_journalEntryId_key" ON "WelfareRequisition"("journalEntryId");

-- CreateIndex
CREATE INDEX "WelfareRequisition_welfareTypeId_idx" ON "WelfareRequisition"("welfareTypeId");

-- CreateIndex
CREATE INDEX "WelfareRequisition_memberId_idx" ON "WelfareRequisition"("memberId");

-- CreateIndex
CREATE INDEX "WelfareRequisition_status_idx" ON "WelfareRequisition"("status");

-- CreateIndex
CREATE INDEX "WelfareApproval_requisitionId_idx" ON "WelfareApproval"("requisitionId");

-- CreateIndex
CREATE INDEX "WelfareApproval_approverId_idx" ON "WelfareApproval"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareApproval_requisitionId_approverId_key" ON "WelfareApproval"("requisitionId", "approverId");

-- CreateIndex
CREATE INDEX "WelfareJourneyEvent_requisitionId_idx" ON "WelfareJourneyEvent"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareFundTransaction_externalReferenceId_key" ON "WelfareFundTransaction"("externalReferenceId");

-- CreateIndex
CREATE INDEX "WelfareFundTransaction_createdAt_idx" ON "WelfareFundTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationConfig_event_key" ON "NotificationConfig"("event");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_type_idx" ON "ApprovalRequest"("type");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_checkoutRequestId_key" ON "Transaction"("checkoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingTransaction_ncbaReference_key" ON "PendingTransaction"("ncbaReference");

-- CreateIndex
CREATE INDEX "PendingTransaction_ncbaReference_idx" ON "PendingTransaction"("ncbaReference");

-- CreateIndex
CREATE INDEX "PendingTransaction_payingPhone_amount_status_idx" ON "PendingTransaction"("payingPhone", "amount", "status");

-- CreateIndex
CREATE INDEX "PendingTransaction_userId_idx" ON "PendingTransaction"("userId");

-- CreateIndex
CREATE INDEX "ApprovalHistory_entityType_entityId_idx" ON "ApprovalHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ApprovalDelegation_fromUserId_toUserId_idx" ON "ApprovalDelegation"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "ApprovalDelegation_toUserId_entityType_idx" ON "ApprovalDelegation"("toUserId", "entityType");

-- CreateIndex
CREATE INDEX "ApprovalDelegation_toUserId_expiresAt_idx" ON "ApprovalDelegation"("toUserId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDefinition_entityType_key" ON "WorkflowDefinition"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStage_workflowId_stepNumber_key" ON "WorkflowStage"("workflowId", "stepNumber");

-- CreateIndex
CREATE INDEX "WorkflowRequest_entityType_entityId_idx" ON "WorkflowRequest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowRequest_status_idx" ON "WorkflowRequest"("status");

-- CreateIndex
CREATE INDEX "WorkflowRequest_requesterId_idx" ON "WorkflowRequest"("requesterId");

-- CreateIndex
CREATE INDEX "WorkflowAction_requestId_idx" ON "WorkflowAction"("requestId");

-- CreateIndex
CREATE INDEX "WorkflowAction_actorId_idx" ON "WorkflowAction"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemModule_key_key" ON "SystemModule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_moduleKey_key" ON "RolePermission"("role", "moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_type_key" ON "EmailTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "EmailNotificationLog_loanId_templateType_key" ON "EmailNotificationLog"("loanId", "templateType");

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LedgerAccount"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_accountingPeriodId_fkey" FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDetail" ADD CONSTRAINT "MemberDetail_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberContact" ADD CONSTRAINT "MemberContact_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberIdentifier" ADD CONSTRAINT "MemberIdentifier_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuarantorMap" ADD CONSTRAINT "GuarantorMap_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuarantorMap" ADD CONSTRAINT "GuarantorMap_guarantorId_fkey" FOREIGN KEY ("guarantorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_loanProductId_fkey" FOREIGN KEY ("loanProductId") REFERENCES "LoanProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanDraft" ADD CONSTRAINT "LoanDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanHistory" ADD CONSTRAINT "LoanHistory_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestPosting" ADD CONSTRAINT "InterestPosting_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestPosting" ADD CONSTRAINT "InterestPosting_runId_fkey" FOREIGN KEY ("runId") REFERENCES "InterestEngineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTopUp" ADD CONSTRAINT "LoanTopUp_newLoanId_fkey" FOREIGN KEY ("newLoanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTopUp" ADD CONSTRAINT "LoanTopUp_oldLoanId_fkey" FOREIGN KEY ("oldLoanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "ExpenseSubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSubCategory" ADD CONSTRAINT "ExpenseSubCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExpenseCategoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchPayment" ADD CONSTRAINT "BatchPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItem" ADD CONSTRAINT "BatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItem" ADD CONSTRAINT "BatchItem_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferApproval" ADD CONSTRAINT "TransferApproval_transferRequestId_fkey" FOREIGN KEY ("transferRequestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferApproval" ADD CONSTRAINT "TransferApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionTransaction" ADD CONSTRAINT "ContributionTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionTransaction" ADD CONSTRAINT "ContributionTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_relatedLoanId_fkey" FOREIGN KEY ("relatedLoanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_contributionTransactionId_fkey" FOREIGN KEY ("contributionTransactionId") REFERENCES "ContributionTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaccoSettings" ADD CONSTRAINT "SaccoSettings_meetingFeesGlId_fkey" FOREIGN KEY ("meetingFeesGlId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaccoSettings" ADD CONSTRAINT "SaccoSettings_meetingReceivableGlId_fkey" FOREIGN KEY ("meetingReceivableGlId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apology" ADD CONSTRAINT "Apology_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apology" ADD CONSTRAINT "Apology_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceFine" ADD CONSTRAINT "AttendanceFine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceFine" ADD CONSTRAINT "AttendanceFine_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApproval" ADD CONSTRAINT "LoanApproval_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApproval" ADD CONSTRAINT "LoanApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestEngineRun" ADD CONSTRAINT "InterestEngineRun_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanJourneyEvent" ADD CONSTRAINT "LoanJourneyEvent_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NextOfKin" ADD CONSTRAINT "NextOfKin_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAccountingMapping" ADD CONSTRAINT "SystemAccountingMapping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAccountingMapping" ADD CONSTRAINT "ProductAccountingMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAccountingMapping" ADD CONSTRAINT "ProductAccountingMapping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTransaction" ADD CONSTRAINT "LoanTransaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTransaction" ADD CONSTRAINT "LoanTransaction_runId_fkey" FOREIGN KEY ("runId") REFERENCES "InterestEngineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentInstallment" ADD CONSTRAINT "RepaymentInstallment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTracker" ADD CONSTRAINT "MonthlyTracker_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ContributionProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FineSnapshot" ADD CONSTRAINT "FineSnapshot_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareType" ADD CONSTRAINT "WelfareType_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareCustomField" ADD CONSTRAINT "WelfareCustomField_welfareTypeId_fkey" FOREIGN KEY ("welfareTypeId") REFERENCES "WelfareType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_welfareTypeId_fkey" FOREIGN KEY ("welfareTypeId") REFERENCES "WelfareType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "LedgerTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareApproval" ADD CONSTRAINT "WelfareApproval_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "WelfareRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareApproval" ADD CONSTRAINT "WelfareApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareJourneyEvent" ADD CONSTRAINT "WelfareJourneyEvent_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "WelfareRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareFundTransaction" ADD CONSTRAINT "WelfareFundTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingTransaction" ADD CONSTRAINT "PendingTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingTransaction" ADD CONSTRAINT "PendingTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDelegation" ADD CONSTRAINT "ApprovalDelegation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDelegation" ADD CONSTRAINT "ApprovalDelegation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRequest" ADD CONSTRAINT "WorkflowRequest_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRequest" ADD CONSTRAINT "WorkflowRequest_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "WorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRequest" ADD CONSTRAINT "WorkflowRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAction" ADD CONSTRAINT "WorkflowAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAction" ADD CONSTRAINT "WorkflowAction_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "WorkflowStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAction" ADD CONSTRAINT "WorkflowAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_moduleKey_fkey" FOREIGN KEY ("moduleKey") REFERENCES "SystemModule"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
