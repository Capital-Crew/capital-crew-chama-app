import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllLoans() {
  console.log('🚀 Starting "Strict" Loan Purge...');

  try {
    const loanCount = await prisma.loan.count();
    if (loanCount === 0) {
      console.log('ℹ️ No loans found in the database. Nothing to delete.');
      return;
    }

    console.log(`⚠️ Found ${loanCount} loans. Beginning cascading delete...`);

    await prisma.$transaction([
      // 1. Delete dependent loan-only records
      prisma.loanTransaction.deleteMany({}),
      prisma.interestPosting.deleteMany({}),
      prisma.repaymentInstallment.deleteMany({}),
      prisma.guarantorMap.deleteMany({}),
      prisma.loanJourneyEvent.deleteMany({}),
      prisma.loanApproval.deleteMany({}),
      prisma.loanHistory.deleteMany({}),
      prisma.interestEngineRun.deleteMany({}),
      prisma.loanTopUp.deleteMany({}),

      // 2. Clear Accounting impacts linked strictly to loans
      // Note: We only delete GL/Wallet entries linked to a loan so we don't wipe share contributions or expenses.
      prisma.generalLedger.deleteMany({
        where: { loanId: { not: null } }
      }),
      prisma.walletTransaction.deleteMany({
        where: { relatedLoanId: { not: null } }
      }),

      // 3. Final Step: Delete the Loan records themselves
      prisma.loan.deleteMany({}),
    ]);

    console.log('✅ SUCCESS: All loans and related transactions/accruals have been strictly deleted.');
    console.log('💡 The system is now ready for clean data entry.');

  } catch (error) {
    console.error('❌ FAILED to clear loans:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllLoans();
