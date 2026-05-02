import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany({
    include: { contactInfo: true }
  });

  for (const member of members) {
    if (!member.contactInfo) {
      throw new Error(`CRITICAL: Member ${member.name} (Member #${member.memberNumber}) is missing their contact info record. Users' details can only be edited or changed by them.`);
    } else if (!member.contactInfo.mobile && !member.contactInfo.phone) {
      throw new Error(`CRITICAL: Member ${member.name} (Member #${member.memberNumber}) has an incomplete contact info record (missing both mobile and phone). Users' details can only be edited or changed by them.`);
    }
  }
  console.log('All members have complete contact info.');
}

main().catch(e => {
  console.error(e.message || e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
