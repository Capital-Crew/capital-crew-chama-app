const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.approvalRequest.groupBy({
    by: ['type'],
    _count: true
  });
  console.log('DISTRIBUTION_START');
  console.log(JSON.stringify(types, null, 2));
  console.log('DISTRIBUTION_END');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
