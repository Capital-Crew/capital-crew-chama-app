import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check if Income model still exists in the client
    // If not, we'll try raw queries
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables:', tables);

    const incomeExists = (tables as any[]).some(t => t.table_name === 'Income' || t.table_name === 'income');
    const revenueExists = (tables as any[]).some(t => t.table_name === 'Revenue' || t.table_name === 'revenue');

    if (incomeExists) {
      const incomeCount: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Income"`;
      console.log('Income count:', incomeCount[0].count);
    } else {
      console.log('Income table does not exist in DB.');
    }

    if (revenueExists) {
      const revenueCount: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Revenue"`;
      console.log('Revenue count:', revenueCount[0].count);
    } else {
      console.log('Revenue table does not exist in DB.');
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
