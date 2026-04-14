import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.ledgerAccount.findMany();
  console.log('--- CHART OF ACCOUNTS ---');
  accounts.forEach(a => {
    console.log(`[${a.code}] ID: ${a.id} | NAME: ${a.name}`);
  });
  console.log('-------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
