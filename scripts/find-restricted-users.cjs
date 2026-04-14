const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      member: {
        include: {
          wallet: {
            include: { glAccount: true }
          }
        }
      }
    }
  });

  console.log('--- SUBSCRIPTION RESTRICTION DIAGNOSTIC ---');
  
  const restricted = [];

  for (const u of users) {
    const reasons = [];
    
    if (!u.member) {
      reasons.push("Not a registered Member (User only)");
    } else {
      const wallet = u.member.wallet;
      if (!wallet) {
        reasons.push("No Wallet record found");
      } else if (!wallet.glAccountId || !wallet.glAccount) {
        reasons.push("Missing GL Account Mapping (3012)");
      } else if (Number(wallet.glAccount.balance) <= 0) {
        reasons.push(`Zero/Empty Balance (Current: ${wallet.glAccount.balance})`);
      }
    }

    if (reasons.length > 0) {
      restricted.push({
        id: u.id,
        name: u.name || u.email,
        reasons
      });
    }
  }

  if (restricted.length === 0) {
    console.log("No restricted users found. All users appear eligible based on ledger state.");
  } else {
    console.log(`Found ${restricted.length} restricted users:`);
    restricted.forEach(r => {
      console.log(`- ${r.name} (ID: ${r.id})`);
      r.reasons.forEach(reason => console.log(`    ❌ ${reason}`));
    });
  }
  
  console.log('-------------------------------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
