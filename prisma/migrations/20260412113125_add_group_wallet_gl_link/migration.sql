-- AlterTable
ALTER TABLE "group_wallets" ADD COLUMN     "glAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "group_wallets" ADD CONSTRAINT "group_wallets_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
