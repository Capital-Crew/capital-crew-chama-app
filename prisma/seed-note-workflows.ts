import { PrismaClient, EntityType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Loan Note Workflows...');

  // 1. LOAN_NOTE (Listing Approval) - 1 Admin
  await prisma.workflowDefinition.upsert({
    where: { entityType: EntityType.LOAN_NOTE },
    update: { isActive: true },
    create: {
      entityType: EntityType.LOAN_NOTE,
      name: 'Loan Note Listing Approval',
      description: 'Approval process for listing a new Loan Note to subscribers',
      stages: {
        create: [
          {
            stepNumber: 1,
            name: 'Admin Review',
            requiredRole: UserRole.SYSTEM_ADMIN,
            minVotesRequired: 1,
            isFinal: true,
          },
        ],
      },
    },
  });

  // 2. LOAN_NOTE_PAYMENT (Returns Approval) - 2 Admins
  await prisma.workflowDefinition.upsert({
    where: { entityType: EntityType.LOAN_NOTE_PAYMENT },
    update: { isActive: true },
    create: {
      entityType: EntityType.LOAN_NOTE_PAYMENT,
      name: 'Loan Note Returns Approval',
      description: 'Approval process for posting returns/payouts to subscribers',
      stages: {
        create: [
          {
            stepNumber: 1,
            name: 'Committee Approval',
            requiredRole: UserRole.SYSTEM_ADMIN,
            minVotesRequired: 2,
            isFinal: true,
          },
        ],
      },
    },
  });

  // 3. LOAN_NOTE_SETTLEMENT (Early Settlement Approval) - 2 Admins
  await prisma.workflowDefinition.upsert({
    where: { entityType: EntityType.LOAN_NOTE_SETTLEMENT },
    update: { isActive: true },
    create: {
      entityType: EntityType.LOAN_NOTE_SETTLEMENT,
      name: 'Loan Note Early Settlement',
      description: 'Approval process for early note termination and final payout',
      stages: {
        create: [
          {
            stepNumber: 1,
            name: 'Committee Approval',
            requiredRole: UserRole.SYSTEM_ADMIN,
            minVotesRequired: 2,
            isFinal: true,
          },
        ],
      },
    },
  });

  // 4. Initialize Sacco Settings with CLN Governance
  const settings = await prisma.saccoSettings.findFirst();
  if (settings) {
    await prisma.saccoSettings.update({
      where: { id: settings.id },
      data: {
        clnFloaterSelfApproval: true,
        requiredApprovalsCLN: 1,
        requiredApprovalsCLNPayment: 2,
        requiredApprovalsCLNSettlement: 2,
      } as any,
    });
  }

  console.log('Loan Note Workflows and Settings seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
