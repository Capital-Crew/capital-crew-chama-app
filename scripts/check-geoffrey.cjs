const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'GEOFFREY' } },
    include: {
      member: {
        include: {
          wallet: true
        }
      }
    }
  });

  console.log('--- GEOFFREY SEARCH ---');
  users.forEach(u => {
      console.log(`User: ${u.name} | ID: ${u.id}`);
      if (u.member) {
          console.log(`  MemberID: ${u.member.id}`);
          if (u.member.wallet) {
              console.log(`  WalletID: ${u.member.wallet.id} | GL_ID: ${u.member.wallet.glAccountId}`);
          } else {
              console.log(`  Wallet: MISSING`);
          }
      } else {
          console.log(`  Member: MISSING`);
      }
  });
  console.log('-----------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
