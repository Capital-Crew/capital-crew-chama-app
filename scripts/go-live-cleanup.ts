import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Database Cleanup for Go-Live...');

  try {
    // We use a single transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      
      console.log('1. Truncating Wallets & Contributions...');
      await tx.$executeRawUnsafe(`TRUNCATE TABLE "WalletTransaction", "Contribution", "ContributionTransaction", "PendingTransaction", "Transaction" RESTART IDENTITY CASCADE;`);

      console.log('2. Truncating Loans...');
      await tx.$executeRawUnsafe(`TRUNCATE TABLE "Loan", "LoanDraft", "LoanHistory", "LoanTransaction", "InterestPosting", "LoanTopUp", "RepaymentInstallment", "LoanApproval", "LoanJourneyEvent" RESTART IDENTITY CASCADE;`);

      console.log('3. Truncating Market (Loan Notes)...');
      await tx.$executeRawUnsafe(`TRUNCATE TABLE "loan_notes", "loan_note_subscriptions", "loan_note_payment_schedule", "loan_note_payment_disbursements", "escrow_ledger", "escrow_accounts" RESTART IDENTITY CASCADE;`);

      console.log('4. Truncating Accounting Ledger...');
      await tx.$executeRawUnsafe(`TRUNCATE TABLE "LedgerTransaction", "LedgerEntry" RESTART IDENTITY CASCADE;`);

      console.log('5. Truncating Projections...');
      await tx.$executeRawUnsafe(`TRUNCATE TABLE "LoanSummaryProjection", "MemberBalanceProjection" RESTART IDENTITY CASCADE;`);

      console.log('6. Resetting Balances...');
      const ledgerRes = await tx.$executeRawUnsafe(`UPDATE "LedgerAccount" SET "balance" = 0;`);
      console.log(`   Reset ${ledgerRes} Ledger Accounts.`);
    });

    console.log('✅ Cleanup completed successfully. Database is ready for production.');
  } catch (error) {
    console.error('❌ Failed to clean database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
