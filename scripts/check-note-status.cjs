const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notes = await prisma.loanNote.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      floaterId: true,
      referenceNo: true
    }
  });
  console.log(JSON.stringify(notes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
