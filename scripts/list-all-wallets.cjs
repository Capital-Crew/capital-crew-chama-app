const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const wallets = await prisma.wallet.findMany({
    include: {
      glAccount: true,
      member: {
        include: {
          user: true
        }
      }
    }
  });

  console.log('--- ALL SYSTEM WALLETS ---');
  wallets.forEach(w => {
    const owner = w.member?.user?.name || 'No Member Linked';
    console.log(`[${w.id}] OWNER: ${owner} | GL_ID: ${w.glAccountId} | GL_OBJ: ${!!w.glAccount}`);
  });
  console.log('--------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
