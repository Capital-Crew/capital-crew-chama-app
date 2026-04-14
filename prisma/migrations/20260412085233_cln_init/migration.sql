-- CreateEnum
CREATE TYPE "LoanNoteStatus" AS ENUM ('PENDING_APPROVAL', 'OPEN', 'CLOSED', 'ACTIVE', 'MATURED_AND_SETTLED', 'RECALLED', 'REJECTED', 'UNDER_SUBSCRIBED');

-- CreateEnum
CREATE TYPE "RepaymentMode" AS ENUM ('AT_MATURITY', 'COUPON', 'EMI_FLAT', 'EMI_REDUCING');

-- CreateEnum
CREATE TYPE "SubscriberType" AS ENUM ('USER', 'GROUP');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'PENDING_COMMITTEE_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CLNPaymentStatus" AS ENUM ('UPCOMING', 'AWAITING_SUFFICIENCY_CHECK', 'AWAITING_CONFIRMATION', 'FLOATER_CONFIRMED', 'EXECUTING', 'PAID', 'EXECUTION_FAILED', 'SHORTFALL', 'GRACE_PERIOD', 'IN_DISPUTE');

-- CreateEnum
CREATE TYPE "CLNDisbursementStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "CLNPaymentType" AS ENUM ('DIVIDEND', 'DIVIDEND_STUB', 'PRINCIPAL', 'PRINCIPAL_AND_DIVIDEND', 'EMI', 'EMI_STUB');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DomainEventType" ADD VALUE 'CLN_CREATED';
ALTER TYPE "DomainEventType" ADD VALUE 'CLN_APPROVED';
ALTER TYPE "DomainEventType" ADD VALUE 'CLN_SUBSCRIPTION_PLACED';
ALTER TYPE "DomainEventType" ADD VALUE 'CLN_PAYMENT_EXECUTED';
ALTER TYPE "DomainEventType" ADD VALUE 'CLN_ESCROW_RELEASED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferenceType" ADD VALUE 'CLN_SUBSCRIPTION';
ALTER TYPE "ReferenceType" ADD VALUE 'CLN_PAYMENT';
ALTER TYPE "ReferenceType" ADD VALUE 'CLN_ESCROW_RELEASE';
ALTER TYPE "ReferenceType" ADD VALUE 'CLN_RECALL_REFUND';

-- CreateTable
CREATE TABLE "business_calendar" (
    "calendarDate" DATE NOT NULL,
    "isBusinessDay" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "business_calendar_pkey" PRIMARY KEY ("calendarDate")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_wallets" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "minReservePct" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "allowNegative" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_risk_config" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "maxAllocationPct" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "maxFloaterExposurePct" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "minTreasuryReservePct" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_risk_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_committee_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_investment_proposals" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "proposedAmount" DECIMAL(15,2) NOT NULL,
    "treasuryBalanceAtProposal" DECIMAL(15,2) NOT NULL,
    "pctOfTreasury" DECIMAL(5,2) NOT NULL,
    "postInvestmentBalance" DECIMAL(15,2) NOT NULL,
    "reserveAfterInvestment" DECIMAL(5,2) NOT NULL,
    "floaterExposurePct" DECIMAL(5,2),
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING_COMMITTEE_APPROVAL',
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "businessDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_investment_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_investment_proposal_votes" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "comment" TEXT,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_investment_proposal_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_accounts" (
    "id" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_notes" (
    "id" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "floaterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterRelationship" TEXT,
    "purpose" TEXT NOT NULL,
    "supportDocUrl" TEXT,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "subscribedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "minSubscription" DECIMAL(15,2) NOT NULL,
    "maxSubscription" DECIMAL(15,2),
    "interestRate" DECIMAL(5,2) NOT NULL,
    "tenorValue" INTEGER NOT NULL,
    "tenorUnit" TEXT NOT NULL DEFAULT 'months',
    "repaymentMode" "RepaymentMode" NOT NULL,
    "paymentIntervalMonths" INTEGER,
    "subscriptionDeadline" DATE NOT NULL,
    "closureDate" DATE,
    "maturityDate" DATE,
    "collateral" TEXT,
    "repaymentSource" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "status" "LoanNoteStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "adminReviewComment" TEXT,
    "totalInterestObligation" DECIMAL(15,2),
    "totalPrincipalOwed" DECIMAL(15,2),
    "totalFloaterObligation" DECIMAL(15,2),
    "escrowReleased" BOOLEAN NOT NULL DEFAULT false,
    "escrowReleasedAt" TIMESTAMP(3),
    "escrowReleasedBy" TEXT,
    "escrowReleaseComment" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_note_subscriptions" (
    "id" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "subscriberType" "SubscriberType" NOT NULL DEFAULT 'USER',
    "subscriberId" TEXT,
    "groupId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "sharePct" DECIMAL(8,6),
    "totalInterestDue" DECIMAL(15,2),
    "totalExpectedPayout" DECIMAL(15,2),
    "walletDebited" BOOLEAN NOT NULL DEFAULT false,
    "floaterCredited" BOOLEAN NOT NULL DEFAULT false,
    "fullySettled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessDate" DATE NOT NULL,
    "settledAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "loan_note_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_note_payment_schedule" (
    "id" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "eventNumber" INTEGER NOT NULL,
    "paymentType" "CLNPaymentType" NOT NULL,
    "dueDate" DATE NOT NULL,
    "periodLabel" TEXT,
    "groupAmount" DECIMAL(15,2) NOT NULL,
    "principalComponent" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "interestComponent" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "openingBalance" DECIMAL(15,2),
    "closingBalance" DECIMAL(15,2),
    "isStubPeriod" BOOLEAN NOT NULL DEFAULT false,
    "stubPeriodMonths" INTEGER,
    "status" "CLNPaymentStatus" NOT NULL DEFAULT 'UPCOMING',
    "sufficiencyCheckedAt" TIMESTAMP(3),
    "floaterWalletAtCheck" DECIMAL(15,2),
    "floaterConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "floaterConfirmedAt" TIMESTAMP(3),
    "adminConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "adminConfirmedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "gracePeriodDueDate" DATE,
    "gracePeriodGrantedBy" TEXT,
    "gracePeriodReason" TEXT,
    "disputeRaisedBy" TEXT,
    "disputeReason" TEXT,
    "disputeResolvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_note_payment_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_note_payment_disbursements" (
    "id" TEXT NOT NULL,
    "paymentScheduleId" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "subscriberType" "SubscriberType" NOT NULL,
    "subscriberId" TEXT,
    "groupId" TEXT,
    "paymentType" "CLNPaymentType" NOT NULL,
    "exactAmount" DECIMAL(18,6) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principalComponent" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "interestComponent" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "isResidualRecipient" BOOLEAN NOT NULL DEFAULT false,
    "residualAmount" DECIMAL(15,2) DEFAULT 0.00,
    "walletCredited" BOOLEAN NOT NULL DEFAULT false,
    "creditedAt" TIMESTAMP(3),
    "businessDate" DATE NOT NULL,
    "status" "CLNDisbursementStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "loan_note_payment_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_ledger" (
    "id" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "ledgerTxId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "reason" TEXT NOT NULL,
    "performedBy" TEXT,
    "businessDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_note_audit_log" (
    "id" TEXT NOT NULL,
    "loanNoteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "businessDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_note_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_wallets_groupId_key" ON "group_wallets"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_risk_config_groupId_key" ON "group_risk_config"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_committee_members_groupId_userId_key" ON "group_committee_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_investment_proposal_votes_proposalId_voterId_key" ON "group_investment_proposal_votes"("proposalId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_accounts_loanNoteId_key" ON "escrow_accounts"("loanNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_notes_referenceNo_key" ON "loan_notes"("referenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "loan_note_payment_schedule_loanNoteId_eventNumber_key" ON "loan_note_payment_schedule"("loanNoteId", "eventNumber");

-- AddForeignKey
ALTER TABLE "group_wallets" ADD CONSTRAINT "group_wallets_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_risk_config" ADD CONSTRAINT "group_risk_config_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_committee_members" ADD CONSTRAINT "group_committee_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_committee_members" ADD CONSTRAINT "group_committee_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_investment_proposals" ADD CONSTRAINT "group_investment_proposals_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_investment_proposals" ADD CONSTRAINT "group_investment_proposals_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_investment_proposal_votes" ADD CONSTRAINT "group_investment_proposal_votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "group_investment_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_notes" ADD CONSTRAINT "loan_notes_floaterId_fkey" FOREIGN KEY ("floaterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_subscriptions" ADD CONSTRAINT "loan_note_subscriptions_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_subscriptions" ADD CONSTRAINT "loan_note_subscriptions_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_subscriptions" ADD CONSTRAINT "loan_note_subscriptions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_payment_schedule" ADD CONSTRAINT "loan_note_payment_schedule_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_payment_disbursements" ADD CONSTRAINT "loan_note_payment_disbursements_paymentScheduleId_fkey" FOREIGN KEY ("paymentScheduleId") REFERENCES "loan_note_payment_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_payment_disbursements" ADD CONSTRAINT "loan_note_payment_disbursements_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_payment_disbursements" ADD CONSTRAINT "loan_note_payment_disbursements_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "loan_note_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "loan_note_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_note_audit_log" ADD CONSTRAINT "loan_note_audit_log_loanNoteId_fkey" FOREIGN KEY ("loanNoteId") REFERENCES "loan_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
