import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function revertAllInterest() {
  console.log('🚀 Starting Global Interest Reversal (Full Reset)...');

  try {
    const postings = await prisma.interestPosting.findMany({});
    if (postings.length === 0) {
      console.log('ℹ️ No interest postings found. Nothing to revert.');
      return;
    }

    console.log(`⚠️ Found ${postings.length} interest postings. Processing reversal...`);

    await prisma.$transaction(async (tx) => {
      // 1. Reset Loan Balances
      const loanIds = Array.from(new Set(postings.map(p => p.loanId)));
      
      for (const loanId of loanIds) {
        const loanPostings = postings.filter(p => p.loanId === loanId);
        const totalToDecrement = loanPostings.reduce((sum, p) => sum + Number(p.amount), 0);

        console.log(`📉 Reverting ${totalToDecrement} interest from Loan ${loanId}...`);

        await tx.loan.update({
          where: { id: loanId },
          data: {
            current_balance: { decrement: totalToDecrement },
            accruedInterestTotal: { decrement: totalToDecrement },
          }
        });
      }

      // 2. Delete all Interest Postings
      await tx.interestPosting.deleteMany({});

      // 3. Delete all Interest Transactions (Loan Transactions)
      await tx.loanTransaction.deleteMany({
        where: { type: 'INTEREST' }
      });

      // 4. Delete all Ledger Transactions (Accounting Entries)
      // referenceType: 'LOAN_INTEREST_ACCRUAL' is used by InterestService.postLoanEvent
      const count = await tx.ledgerTransaction.deleteMany({
        where: {
          referenceType: 'LOAN_INTEREST_ACCRUAL'
        }
      });
      console.log(`🧹 Deleted ${count.count} ledger transactions (LOAN_INTEREST_ACCRUAL).`);

    });

    console.log('✅ SUCCESS: All interest charges have been wiped and loan balances restored.');

  } catch (error) {
    console.error('❌ FAILED to revert interest:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

revertAllInterest();
