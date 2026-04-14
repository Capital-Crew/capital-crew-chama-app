const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const memberId = 'cmnnjn2b30000tmlkh7gwf2i5'; // Geoffrey Mwangi's Member ID
  const amount = 20000;
  
  console.log(`🏦 [V3] Loading Wallet for Member ${memberId} with ${amount} KES...`);

  // 1. Resolve Wallet & GL Account
  const wallet = await prisma.wallet.findUnique({
    where: { memberId },
    include: { glAccount: true }
  });

  if (!wallet) {
      throw new Error("Wallet not found for Geoffrey. Please ensure he is registered as a member.");
  }

  // 2. Resolve Bank Account (Asset)
  const bankAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1011' } });
  if (!bankAcc) {
      throw new Error("Bank Account (1011) not found in Chart of Accounts.");
  }

  // 3. Post Ledger Entry (Dr Bank / Cr Wallet)
  await prisma.$transaction(async (tx) => {
    // a. Create Ledger Transaction (Atomic)
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        transactionDate: new Date(),
        referenceType: 'SAVINGS_DEPOSIT',
        referenceId: `TEST-LOAD-${Date.now()}`,
        description: `Manual Test Load for Geoffrey Mwangi`,
        status: 'POSTED',
        totalAmount: amount, // Required field
        createdBy: 'SYSTEM',
        createdByName: 'Test Script',
        ledgerEntries: {
          create: [
            { ledgerAccountId: bankAcc.id, debitAmount: amount, creditAmount: 0, description: 'Source: Bank' },
            { ledgerAccountId: wallet.glAccountId, debitAmount: 0, creditAmount: amount, description: 'Destination: Member Wallet' }
          ]
        }
      }
    });

    // b. Update GL Account Balances
    await tx.ledgerAccount.update({ where: { id: bankAcc.id }, data: { balance: { increment: amount } } });
    await tx.ledgerAccount.update({ where: { id: wallet.glAccountId }, data: { balance: { increment: amount } } });

    // c. Create Wallet Transaction for statement
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: amount,
        balanceAfter: Number(wallet.glAccount.balance) + amount,
        description: `Manual Test Load (Ref: ${ledgerTx.id})`
      }
    });

    console.log(`✅ Success! Geoffrey's wallet has been credited with ${amount}.`);
  });
}

main()
  .catch((err) => {
    console.error('❌ Error during load:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
