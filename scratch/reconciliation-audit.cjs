const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Reconciliation Audit Starting ---');
  
  const members = await prisma.member.findMany({
    select: {
      id: true,
      name: true,
      memberNumber: true,
      contributionBalance: true
    }
  });

  let discrepancies = 0;
  let totalLegacy = 0;
  let totalLedger = 0;

  for (const member of members) {
    const legacyBalance = Number(member.contributionBalance || 0);
    
    // Calculate Ledger Balance (Account 3011 or 2100 - let's check both for safety)
    const result = await prisma.ledgerEntry.aggregate({
      _sum: { creditAmount: true, debitAmount: true },
      where: {
        ledgerAccount: { code: '3011' }, // Standard Contribution Account
        ledgerTransaction: {
          referenceId: member.id,
          isReversed: false
        }
      }
    });

    const ledgerBalance = Number(result._sum.creditAmount || 0n) - Number(result._sum.debitAmount || 0n);
    
    totalLegacy += legacyBalance;
    totalLedger += ledgerBalance;

    if (Math.abs(legacyBalance - ledgerBalance) > 0.01) {
      discrepancies++;
      console.log(`[DISCREPANCY] Member ${member.memberNumber} (${member.name}):`);
      console.log(`  - Legacy Column: ${legacyBalance}`);
      console.log(`  - Ledger Total:  ${ledgerBalance}`);
      console.log(`  - Difference:    ${legacyBalance - ledgerBalance}`);
    }
  }

  console.log('\n--- Audit Summary ---');
  console.log(`Total Members Checked: ${members.length}`);
  console.log(`Discrepancies Found:   ${discrepancies}`);
  console.log(`Total Legacy Volume:   ${totalLegacy}`);
  console.log(`Total Ledger Volume:   ${totalLedger}`);
  
  if (discrepancies === 0) {
    console.log('\nSUCCESS: Ledger is fully reconciled. Columns can be safely removed.');
  } else {
    console.log('\nWARNING: DO NOT DROP COLUMNS. Reconciliation required.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
