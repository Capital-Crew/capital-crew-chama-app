import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany({
    include: { contactInfo: true }
  });

  for (const member of members) {
    if (!member.contactInfo) {
      await prisma.memberContact.create({
        data: {
          memberId: member.id,
          mobile: '254700000000',
          email: `${member.id}@example.com`
        }
      });
      console.log(`Created contact info for member ${member.memberNumber}`);
    } else if (!member.contactInfo.mobile && !member.contactInfo.phone) {
      await prisma.memberContact.update({
        where: { id: member.contactInfo.id },
        data: { mobile: '254700000000' }
      });
      console.log(`Updated mobile for member ${member.memberNumber}`);
    }
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
