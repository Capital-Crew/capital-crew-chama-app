/*
  Warnings:

  - A unique constraint covering the columns `[shareTransactionId]` on the table `GeneralLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShareTransactionType" AS ENUM ('CONTRIBUTION', 'REVERSAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerTransactionType" ADD VALUE 'SHARE_CONTRIBUTION';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'SHARE_REVERSAL';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'CASH_DEPOSIT';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'CASH_WITHDRAWAL';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'LOAN_DISBURSEMENT';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'LOAN_REPAYMENT';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'FEE_CHARGE';
ALTER TYPE "LedgerTransactionType" ADD VALUE 'FEE_REVERSAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WalletTransactionType" ADD VALUE 'DEPOSIT';
ALTER TYPE "WalletTransactionType" ADD VALUE 'SHARE_PURCHASE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'WITHDRAWAL';
ALTER TYPE "WalletTransactionType" ADD VALUE 'REFUND';

-- DropForeignKey
ALTER TABLE "GeneralLedger" DROP CONSTRAINT "GeneralLedger_walletTransactionId_fkey";

-- AlterTable
ALTER TABLE "GeneralLedger" ADD COLUMN     "createdBy" TEXT DEFAULT '',
ADD COLUMN     "creatorName" TEXT DEFAULT '',
ADD COLUMN     "creditAccount" TEXT DEFAULT '',
ADD COLUMN     "debitAccount" TEXT DEFAULT '',
ADD COLUMN     "loanId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "shareTransactionId" TEXT,
ALTER COLUMN "walletTransactionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "shareContributions" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShareTransaction" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "ShareTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalId" TEXT,
    "reverses" TEXT,
    "ledgerEntryId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ShareTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareTransaction_reversalId_key" ON "ShareTransaction"("reversalId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareTransaction_reverses_key" ON "ShareTransaction"("reverses");

-- CreateIndex
CREATE UNIQUE INDEX "ShareTransaction_ledgerEntryId_key" ON "ShareTransaction"("ledgerEntryId");

-- CreateIndex
CREATE INDEX "ShareTransaction_memberId_createdAt_idx" ON "ShareTransaction"("memberId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralLedger_shareTransactionId_key" ON "GeneralLedger"("shareTransactionId");

-- CreateIndex
CREATE INDEX "GeneralLedger_memberId_createdAt_idx" ON "GeneralLedger"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneralLedger_transactionType_createdAt_idx" ON "GeneralLedger"("transactionType", "createdAt");

-- AddForeignKey
ALTER TABLE "ShareTransaction" ADD CONSTRAINT "ShareTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_shareTransactionId_fkey" FOREIGN KEY ("shareTransactionId") REFERENCES "ShareTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
