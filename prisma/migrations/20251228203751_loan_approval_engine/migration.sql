-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CHAIRPERSON', 'TREASURER', 'SECRETARY', 'MEMBER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING_APPROVAL', 'DISBURSED', 'ACTIVE', 'CLEARED', 'OVERDUE', 'REJECTED', 'CANCELLED');

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
CREATE TYPE "IncomeCategory" AS ENUM ('MONTHLY_CONTRIBUTION', 'LOAN_REPAYMENT', 'LOAN_PENALTY', 'NON_LOAN_PENALTY', 'RESCHEDULING_FEE', 'TOP_UP_FEE', 'APPLICATION_FEE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_RECEIVED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_CLEARED', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('LOAN_APPLIED', 'LOAN_VOTE_CAST', 'LOAN_STATUS_CHANGED', 'EXPENSE_REQUEST_CREATED', 'MODIFICATION_REQUEST_CREATED', 'REQUEST_DECISION_MADE', 'FINANCIAL_RECORD_RECORDED', 'SETTINGS_UPDATED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'MEMBER_ADDED', 'DASHBOARD_VIEWED', 'REPORT_DOWNLOADED', 'USER_RIGHTS_UPDATED', 'FEE_EXEMPTION_CHANGED', 'LOAN_APPLICATION_CANCELLED', 'LOAN_DISBURSED', 'CHARGE_TEMPLATE_CREATED', 'WALLET_TRANSACTION_CREATED', 'WALLET_TRANSACTION_REVERSED', 'WALLET_BALANCE_CHECKED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CONTRIBUTION', 'LOAN_DISBURSEMENT', 'REPAYMENT', 'FEE', 'PENALTY', 'REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LoanEventType" AS ENUM ('APPLICATION_SUBMITTED', 'APPROVAL_RECEIVED', 'APPROVAL_REJECTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'REPAYMENT_MADE', 'PENALTY_APPLIED', 'LOAN_CLEARED', 'LOAN_RESCHEDULED', 'LOAN_TOPPED_UP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "canApproveLoan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "numberOfRepayments" INTEGER NOT NULL,
    "repaymentEvery" INTEGER NOT NULL,
    "repaymentFrequencyType" "RepaymentFrequencyType" NOT NULL,
    "interestRatePerPeriod" DOUBLE PRECISION NOT NULL,
    "interestType" "InterestType" NOT NULL,
    "interestCalculationPeriodType" "InterestCalculationPeriodType" NOT NULL,
    "amortizationType" "AmortizationType" NOT NULL,
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
    "loanProductId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "disbursementDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "interestRate" DOUBLE PRECISION NOT NULL,
    "penalties" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "memberSharesAtApplication" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossQualifyingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shareCapitalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "existingLoanOffset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netDisbursementAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvalVotes" JSONB NOT NULL,
    "repaymentSchedule" JSONB NOT NULL,
    "originalRepaymentSchedule" JSONB,
    "feeExemptions" JSONB NOT NULL,
    "productSnapshot" JSONB,
    "loanContract" TEXT,
    "applicationFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "hasBeenRescheduled" BOOLEAN NOT NULL DEFAULT false,
    "hasBeenToppedUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chargeType" "ChargeType" NOT NULL,
    "calculationType" "ChargeCalculationType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDateOffset" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChargeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "IncomeCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "loanId" TEXT,
    "transactionId" TEXT NOT NULL,
    "principalAmount" DOUBLE PRECISION,
    "interestAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
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
    "userId" TEXT NOT NULL,
    "action" "AuditLogAction" NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "relatedLoanId" TEXT,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "reversedBy" TEXT,
    "reverses" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralLedger" (
    "id" TEXT NOT NULL,
    "transactionType" "LedgerTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "memberId" TEXT,
    "walletTransactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaccoSettings" (
    "id" TEXT NOT NULL,
    "loanMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "processingFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "insuranceFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "shareCapitalBoost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaccoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApproval" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" "ApprovalStatus" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanApproval_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_memberNumber_key" ON "Member"("memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanApplicationNumber_key" ON "Loan"("loanApplicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_memberId_key" ON "Wallet"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralLedger_walletTransactionId_key" ON "GeneralLedger"("walletTransactionId");

-- CreateIndex
CREATE INDEX "LoanApproval_loanId_idx" ON "LoanApproval"("loanId");

-- CreateIndex
CREATE INDEX "LoanApproval_approverId_idx" ON "LoanApproval"("approverId");

-- CreateIndex
CREATE INDEX "LoanJourneyEvent_loanId_idx" ON "LoanJourneyEvent"("loanId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_loanProductId_fkey" FOREIGN KEY ("loanProductId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_relatedLoanId_fkey" FOREIGN KEY ("relatedLoanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApproval" ADD CONSTRAINT "LoanApproval_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApproval" ADD CONSTRAINT "LoanApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanJourneyEvent" ADD CONSTRAINT "LoanJourneyEvent_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
