
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 [FINAL FIX] Repairing CLN Ledger & Wallet Mappings...');

  // 1. Create Core Chart of Accounts if missing
  console.log('  1. Verifying Core Chart of Accounts...');
  
  // Liabilities Root
  const rootLiabilities = await prisma.ledgerAccount.upsert({
    where: { code: '2000' },
    update: {},
    create: { code: '2000', name: 'LIABILITIES', type: 'LIABILITY', subType: 'Root', balance: 0, isActive: true }
  });

  // Suspense Header
  const suspenseHeader = await prisma.ledgerAccount.upsert({
    where: { code: '2030' },
    update: { parentId: rootLiabilities.id },
    create: { code: '2030', name: 'Suspense', type: 'LIABILITY', subType: 'Category Header', parentId: rootLiabilities.id, balance: 0, isActive: true }
  });

  // Contributions Root
  const rootContributions = await prisma.ledgerAccount.upsert({
    where: { code: '3000' },
    update: {},
    create: { code: '3000', name: 'CONTRIBUTIONS', type: 'LIABILITY', subType: 'Root', balance: 0, isActive: true }
  });

  // Deposits & Savings Header
  const savingsHeader = await prisma.ledgerAccount.upsert({
    where: { code: '3010' },
    update: { parentId: rootContributions.id },
    create: { code: '3010', name: 'Deposits & Savings', type: 'LIABILITY', subType: 'Category Header', parentId: rootContributions.id, balance: 0, isActive: true }
  });

  // 2. Investment Note Escrow (Target)
  const escrowAccount = await prisma.ledgerAccount.upsert({
    where: { code: 'ESCROW-CLN' },
    update: { parentId: suspenseHeader.id },
    create: {
      code: 'ESCROW-CLN',
      name: 'Investment Note Escrow',
      type: 'LIABILITY',
      subType: 'Active Account',
      parentId: suspenseHeader.id,
      balance: 0,
      isActive: true
    }
  });

  // 3. System Mapping
  await prisma.systemAccountingMapping.upsert({
    where: { type: 'EVENT_CLN_ESCROW' as any },
    update: { accountId: escrowAccount.id },
    create: { type: 'EVENT_CLN_ESCROW' as any, accountId: escrowAccount.id }
  });
  console.log('  ✓ Escrow Infrastructure Ready');

  // 4. Wallet GL Account (3012)
  const walletGL = await prisma.ledgerAccount.upsert({
    where: { code: '3012' },
    update: { parentId: savingsHeader.id },
    create: {
      code: '3012',
      name: 'Member Withdrawable Wallet',
      type: 'LIABILITY',
      subType: 'Active Account',
      parentId: savingsHeader.id,
      balance: 0,
      isActive: true
    }
  });

  // 5. Direct Repair of Wallets (using raw SQL where possible if updateMany fails, but let's try fine-grained update)
  console.log('  2. Repairing Wallet Linkages...');
  
  const walletsToFix = await prisma.wallet.findMany({
    where: { glAccountId: null }
  });

  for (const w of walletsToFix) {
    await prisma.$executeRawUnsafe(`UPDATE "Wallet" SET "glAccountId" = '${walletGL.id}' WHERE id = '${w.id}'`);
  }
  
  console.log(`  ✓ Repaired ${walletsToFix.length} individual wallets.`);

  // 6. Direct Repair of Group Wallets (if any)
  const groupWalletsToFix = await prisma.groupWallet.findMany({
    where: { glAccountId: null }
  });

  for (const gw of groupWalletsToFix) {
    await prisma.$executeRawUnsafe(`UPDATE "GroupWallet" SET "glAccountId" = '${walletGL.id}' WHERE id = '${gw.id}'`);
  }
  console.log(`  ✓ Repaired ${groupWalletsToFix.length} group wallets.`);

  console.log('✅ Final Fix Complete!');
}

main()
  .catch((e) => {
    console.error('❌ FATAL ERROR:', e);
    process.exit(1);
  });
