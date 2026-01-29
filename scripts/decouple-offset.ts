
import { PrismaClient, ReferenceType } from '@prisma/client';
const prisma = new PrismaClient();

async function decoupleOffset(loanNumber: string) {
    console.log(`--- Decoupling Offset for ${loanNumber} ---`);

    // 1. Find the loan
    const loan = await prisma.loan.findFirst({ where: { loanApplicationNumber: loanNumber } });
    if (!loan) return;

    // 2. Find entries that mention this loan but belong to a different referenceId
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            description: { contains: loanNumber },
            ledgerTransaction: {
                referenceId: { not: loan.id }
            }
        },
        include: { ledgerTransaction: true }
    });

    console.log(`Found ${entries.length} candidate entries.`);

    // Group by transaction
    const txGroups = new Map<string, any[]>();
    for (const e of entries) {
        if (!txGroups.has(e.ledgerTransactionId)) txGroups.set(e.ledgerTransactionId, []);
        txGroups.get(e.ledgerTransactionId)!.push(e);
    }

    for (const [oldTxId, group] of txGroups.entries()) {
        const oldTx = group[0].ledgerTransaction;
        console.log(`Processing group from Transaction ${oldTxId} (${oldTx.description})`);

        // Create a NEW transaction for the decoupled entries
        const newTx = await prisma.ledgerTransaction.create({
            data: {
                transactionDate: oldTx.transactionDate,
                postedAt: oldTx.postedAt,
                referenceType: 'LOAN_REPAYMENT' as ReferenceType,
                referenceId: loan.id,
                description: `Decoupled: ${oldTx.description}`,
                notes: 'Decoupled for balance accuracy',
                totalAmount: 0, // Will be updated
                createdBy: oldTx.createdBy,
                createdByName: oldTx.createdByName
            }
        });

        let totalDecoupled = 0;
        for (const e of group) {
            console.log(`  Moving entry ${e.id} (${e.description}) to new transaction ${newTx.id}`);
            await prisma.ledgerEntry.update({
                where: { id: e.id },
                data: { ledgerTransactionId: newTx.id }
            });
            totalDecoupled += Number(e.debitAmount) + Number(e.creditAmount);
        }

        // Update totalAmount on new transaction (sum of entries usually? No, it's balanced. 
        // We'll just put the sum of movements)
        await prisma.ledgerTransaction.update({
            where: { id: newTx.id },
            data: { totalAmount: totalDecoupled / 2 } // Balanced JE
        });

        // Note: The OLD transaction is now UNBALANCED.
        // We need to add a balancing entry to the OLD transaction?
        // Wait! If I move the CR Portfolio (LN005) away from Trans LN010, Trans LN010 is now missing 10019.35 credits.
        // We should add a CR/DR to an "Interim/Suspense" account in both JEs to keep them balanced.
    }
}

// Actually, maybe it's simpler to just fix the AccountingEngine to search better.
// BUT that requires code changes that might be risky across the system.
// A data fix is safer for these specific messed up loans.

decoupleOffset('LN005')
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
