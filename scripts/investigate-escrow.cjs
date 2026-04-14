const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const note = await prisma.loanNote.findFirst({
    where: { referenceNo: 'CLN-1776013165020-307' },
    select: {
      id: true,
      referenceNo: true,
      status: true,
      subscribedAmount: true,
      escrowReleased: true
    }
  });
  
  if (!note) {
    console.log("Note not found");
    return;
  }

  console.log("Note Status Details:", JSON.stringify(note, null, 2));

  const transactions = await prisma.ledgerTransaction.findMany({
    where: {
      referenceId: note.id,
      OR: [
        { referenceType: 'CLN_SUBSCRIPTION' },
        { referenceType: 'CLN_ESCROW_RELEASE' }
      ]
    },
    include: {
        ledgerEntries: {
            include: {
                ledgerAccount: {
                    select: { name: true, code: true }
                }
            }
        }
    }
  });

  console.log("Ledger Evidence:", JSON.stringify(transactions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
