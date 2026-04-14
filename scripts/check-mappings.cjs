const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const mappings = await prisma.systemAccountingMapping.findMany({
    include: {
      account: true
    }
  });

  console.log('--- SYSTEM ACCOUNTING MAPPINGS ---');
  mappings.forEach(m => {
    console.log(`Type: ${m.type} | Account: ${m.account.code} (${m.account.name})`);
  });
  console.log('-----------------------------------');
  
  const esc = mappings.find(m => m.type === 'EVENT_CLN_ESCROW');
  if (esc) {
    console.log('✅ EVENT_CLN_ESCROW is PRESENT and correctly mapped.');
  } else {
    console.log('❌ EVENT_CLN_ESCROW is MISSING from the mapping list.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
