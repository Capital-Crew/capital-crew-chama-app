const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const gid = 'cmnn8p00v001htm38jbl1cpti';
  console.log('🚀 [GRANULAR] Finalizing repair using plain JS...');

  // 1. Repair Individual Wallets
  const wallets = await prisma.wallet.findMany();
  let wRepaired = 0;
  for (const w of wallets) {
    if (!w.glAccountId) {
      await prisma.wallet.update({
        where: { id: w.id },
        data: { glAccountId: gid }
      });
      wRepaired++;
    }
  }
  console.log('Repaired wallets:', wRepaired);

  // 2. Repair Group Wallets
  const gwallets = await prisma.groupWallet.findMany();
  let gRepaired = 0;
  for (const gw of gwallets) {
    if (!gw.glAccountId) {
      await prisma.groupWallet.update({
        where: { id: gw.id },
        data: { glAccountId: gid }
      });
      gRepaired++;
    }
  }
  console.log('Repaired group wallets:', gRepaired);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
