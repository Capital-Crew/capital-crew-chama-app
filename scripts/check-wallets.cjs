const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const wallets = await prisma.wallet.findMany({
    include: {
      member: {
        include: {
          user: true
        }
      },
      glAccount: true
    }
  });

  console.log('--- WALLET DIAGNOSTIC ---');
  wallets.forEach(w => {
    const userName = w.member?.user?.name || 'Unknown';
    console.log(`User: ${userName} | WalletID: ${w.id} | GL_ID: ${w.glAccountId} | GL_OBJ: ${!!w.glAccount}`);
  });
  console.log('-------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
