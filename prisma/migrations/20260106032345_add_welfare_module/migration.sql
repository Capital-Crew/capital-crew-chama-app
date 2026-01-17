/*
  Warnings:

  - You are about to alter the column `amount` on the `ChargeTemplate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `amount` on the `GeneralLedger` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `amount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `principalAmount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `interestAmount` on the `Income` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `totalDebit` on the `JournalEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `totalCredit` on the `JournalEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `debitAmount` on the `JournalLine` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `creditAmount` on the `JournalLine` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `amount` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `interestRate` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,6)`.
  - You are about to alter the column `penalties` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `memberSharesAtApplication` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `grossQualifyingAmount` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `processingFee` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `insuranceFee` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `shareCapitalDeduction` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `existingLoanOffset` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `totalDeductions` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `netDisbursementAmount` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `principal` on the `LoanProduct` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `interestRatePerPeriod` on the `LoanProduct` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,6)`.
  - You are about to alter the column `shareContributions` on the `Member` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `loanMultiplier` on the `SaccoSettings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `processingFeePercent` on the `SaccoSettings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `insuranceFeePercent` on the `SaccoSettings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `shareCapitalBoost` on the `SaccoSettings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `amount` on the `ShareTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `balance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `amount` on the `WalletTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `balanceAfter` on the `WalletTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - A unique constraint covering the columns `[shortCode]` on the table `LoanProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expenseAccountId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AggregateType" AS ENUM ('LOAN', 'MEMBER', 'WALLET', 'SHARE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DomainEventType" AS ENUM ('LOAN_APPLIED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'REPAYMENT_MADE', 'LOAN_CLEARED', 'LOAN_RESCHEDULED', 'LOAN_TOPPED_UP', 'PENALTY_APPLIED', 'MEMBER_REGISTERED', 'MEMBER_UPDATED', 'MEMBER_DEACTIVATED', 'WALLET_CREATED', 'WALLET_DEPOSIT_MADE', 'WALLET_WITHDRAWAL_MADE', 'SHARE_CONTRIBUTION_MADE', 'SHARE_CONTRIBUTION_REVERSED', 'SYSTEM_MIGRATION', 'SYSTEM_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD');

-- CreateEnum
CREATE TYPE "CommandResourceType" AS ENUM ('MEMBER', 'LOAN');

-- CreateEnum
CREATE TYPE "InterestPostingType" AS ENUM ('DISBURSEMENT_ACCRUAL', 'MONTHLY_ACCRUAL');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "NextOfKinRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "PenaltyStatus" AS ENUM ('NONE', 'PENDING', 'APPLIED');

-- CreateEnum
CREATE TYPE "ProductAccountingType" AS ENUM ('INTEREST_INCOME', 'FEE_INCOME', 'PENALTY_INCOME', 'LOAN_PORTFOLIO', 'INTEREST_RECEIVABLE', 'PENALTY_RECEIVABLE', 'FUND_SOURCE');

-- CreateEnum
CREATE TYPE "SystemAccountType" AS ENUM ('EVENT_EXPENSE_PAYMENT', 'EVENT_CASH_DEPOSIT', 'EVENT_CASH_WITHDRAWAL', 'EVENT_LOAN_DISBURSEMENT', 'EVENT_LOAN_REPAYMENT_PRINCIPAL', 'EVENT_SHARE_CONTRIBUTION', 'INCOME_LOAN_INTEREST', 'RECEIVABLE_LOAN_INTEREST', 'INCOME_LOAN_PENALTY', 'RECEIVABLE_LOAN_PENALTY', 'INCOME_LOAN_PROCESSING_FEE', 'INCOME_GENERAL_FEE', 'CASH_ON_HAND', 'RECEIVABLES', 'MEMBER_WALLET', 'CONTRIBUTIONS', 'INCOME');

-- CreateEnum
CREATE TYPE "LoanTransactionType" AS ENUM ('DISBURSEMENT', 'REPAYMENT', 'INTEREST', 'PENALTY', 'WAIVER');

-- CreateEnum
CREATE TYPE "WelfareStatus" AS ENUM ('PENDING', 'APPROVED', 'DISBURSED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WelfareEventType" AS ENUM ('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditLogAction" ADD VALUE 'MIGRATION';
ALTER TYPE "AuditLogAction" ADD VALUE 'BULK_MIGRATION';
ALTER TYPE "AuditLogAction" ADD VALUE 'JOURNAL_REVERSAL';
ALTER TYPE "AuditLogAction" ADD VALUE 'INTEREST_ENGINE_RUN';
ALTER TYPE "AuditLogAction" ADD VALUE 'PENALTY_ENGINE_RUN';
ALTER TYPE "AuditLogAction" ADD VALUE 'EXPENSE_REQUESTED';
ALTER TYPE "AuditLogAction" ADD VALUE 'EXPENSE_APPROVED';
ALTER TYPE "AuditLogAction" ADD VALUE 'EXPENSE_REJECTED';
ALTER TYPE "AuditLogAction" ADD VALUE 'EXPENSE_PAID';

-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "ChargeTemplate" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "expenseAccountId" TEXT NOT NULL,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "requesterId" TEXT NOT NULL,
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "GeneralLedger" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "Income" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "principalAmount" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "interestAmount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "JournalEntry" ALTER COLUMN "totalDebit" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "totalCredit" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "JournalLine" ALTER COLUMN "debitAmount" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "creditAmount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "accruedInterestTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "current_balance" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "interestRatePerMonth" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "lastInterestRunDate" TIMESTAMP(3),
ADD COLUMN     "monthlyInstallment" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "nextInterestRunDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "outstandingBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "penaltyRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "interestRate" SET DATA TYPE DECIMAL(10,6),
ALTER COLUMN "penalties" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "memberSharesAtApplication" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "grossQualifyingAmount" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "processingFee" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "insuranceFee" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "shareCapitalDeduction" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "existingLoanOffset" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "totalDeductions" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "netDisbursementAmount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "LoanProduct" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KES',
ADD COLUMN     "defaultPenaltyRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "gracePeriod" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPrincipal" DECIMAL(19,4) NOT NULL DEFAULT 1000000,
ADD COLUMN     "maxRepaymentTerms" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "minPrincipal" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "minRepaymentTerms" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shortCode" TEXT NOT NULL DEFAULT 'LP',
ALTER COLUMN "principal" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "interestRatePerPeriod" SET DATA TYPE DECIMAL(10,6);

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activatedBy" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "beneficiaries" JSONB,
ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedBy" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "shareContributions" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "SaccoSettings" ADD COLUMN     "allowLoanTopUp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "penaltyRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
ADD COLUMN     "refinanceFeePercentage" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
ADD COLUMN     "requiredApprovalsReschedule" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "requiredApprovalsTopUp" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "requiredWelfareApprovals" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "rescheduleFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
ADD COLUMN     "welfareCurrentBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "welfareMonthlyContribution" DECIMAL(19,4) NOT NULL DEFAULT 0,
ALTER COLUMN "loanMultiplier" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "processingFeePercent" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "insuranceFeePercent" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "shareCapitalBoost" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "ShareTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarPreset" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "WalletTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(19,4);

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
    "amountGuaranteed" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuarantorMap_pkey" PRIMARY KEY ("id")
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
    "shareCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "type" "LoanTransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "principalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feeAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanTransaction_pkey" PRIMARY KEY ("id")
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WelfareFundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

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
CREATE INDEX "InterestPosting_loanId_idx" ON "InterestPosting"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestPosting_loanId_periodMonth_periodYear_type_key" ON "InterestPosting"("loanId", "periodMonth", "periodYear", "type");

-- CreateIndex
CREATE INDEX "LoanTopUp_newLoanId_idx" ON "LoanTopUp"("newLoanId");

-- CreateIndex
CREATE INDEX "LoanTopUp_oldLoanId_idx" ON "LoanTopUp"("oldLoanId");

-- CreateIndex
CREATE INDEX "TransferRequest_requesterId_idx" ON "TransferRequest"("requesterId");

-- CreateIndex
CREATE INDEX "TransferRequest_status_idx" ON "TransferRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TransferApproval_transferRequestId_approverId_key" ON "TransferApproval"("transferRequestId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseApproval_expenseId_userId_key" ON "ExpenseApproval"("expenseId", "userId");

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
CREATE INDEX "WelfareFundTransaction_type_idx" ON "WelfareFundTransaction"("type");

-- CreateIndex
CREATE INDEX "WelfareFundTransaction_createdAt_idx" ON "WelfareFundTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_requesterId_idx" ON "Expense"("requesterId");

-- CreateIndex
CREATE INDEX "Expense_expenseAccountId_idx" ON "Expense"("expenseAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_shortCode_key" ON "LoanProduct"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Member_externalId_key" ON "Member"("externalId");

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
ALTER TABLE "InterestPosting" ADD CONSTRAINT "InterestPosting_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTopUp" ADD CONSTRAINT "LoanTopUp_newLoanId_fkey" FOREIGN KEY ("newLoanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTopUp" ADD CONSTRAINT "LoanTopUp_oldLoanId_fkey" FOREIGN KEY ("oldLoanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferApproval" ADD CONSTRAINT "TransferApproval_transferRequestId_fkey" FOREIGN KEY ("transferRequestId") REFERENCES "TransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferApproval" ADD CONSTRAINT "TransferApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NextOfKin" ADD CONSTRAINT "NextOfKin_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAccountingMapping" ADD CONSTRAINT "SystemAccountingMapping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAccountingMapping" ADD CONSTRAINT "ProductAccountingMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAccountingMapping" ADD CONSTRAINT "ProductAccountingMapping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanTransaction" ADD CONSTRAINT "LoanTransaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentInstallment" ADD CONSTRAINT "RepaymentInstallment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareType" ADD CONSTRAINT "WelfareType_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareCustomField" ADD CONSTRAINT "WelfareCustomField_welfareTypeId_fkey" FOREIGN KEY ("welfareTypeId") REFERENCES "WelfareType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_welfareTypeId_fkey" FOREIGN KEY ("welfareTypeId") REFERENCES "WelfareType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareRequisition" ADD CONSTRAINT "WelfareRequisition_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
