
import { PrismaClient, AccountType } from '@prisma/client';
const prisma = new PrismaClient();

async function migrateAllLoanEntries() {
    console.log('--- STARTING GLOBAL LOAN LEDGER REPAIR ---');

    console.log('Step 1: Identifying all loans...');
    const loans = await prisma.loan.findMany({ select: { id: true, loanApplicationNumber: true } });
    const loanIds = loans.map(l => l.id);
    const loanMap = new Map(loans.map(l => [l.id, l.loanApplicationNumber]));

    console.log('Step 2: Fetching asset accounts...');
    const portfolioAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } }); // Portfolio
    const interestAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1320' } });  // Interest

    if (!portfolioAcc || !interestAcc) {
        console.error('Core asset accounts missing!');
        return;
    }

    console.log('Step 3: Finding mis-mapped entries...');
    // We look for entries linked to a loan ID (as referenceId) but not in an Asset account.
    // Or in an Asset account that is not 1310/1320.
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerTransaction: {
                referenceId: { in: loanIds },
                isReversed: false
            },
            NOT: {
                ledgerAccountId: { in: [portfolioAcc.id, interestAcc.id] }
            },
            ledgerAccount: {
                // Ignore cases where it hits a Wallet or Income account on purpose (the Credit side of a Net Disbursement)
                // Actually, the CREDIT side of a disbursement is the Wallet.
                // The DEBIT side is the Asset.
                // The CREDIT side of a repayment is the Asset.
                // The DEBIT side of a repayment is the Wallet.

                // So: Any DEBIT should be Asset, any CREDIT should be Asset (depending on transaction type)
                // Wait. 
                // Disbursement: DR Asset, CR Wallet.
                // Repayment: DR Wallet, CR Asset.

                // If an entry is linked to a Loan in the LedgerTransaction, it is either:
                // 1. The Asset Movement (DR Disbursement, CR Repayment)
                // 2. The Income Movement (CR Fee)

                // We want all entries that are TRULY the loan asset movement to be in 1310/1320.
                // How to distinguish?
                // Entries with Desc like "Principal", "Interest", "Penalty", "Repayment", "Disbursement" should be Asset.
                // Entries with Desc like "Processing Fee", "Insurance", "Refinance Fee" should be Revenue.
            }
        },
        include: { ledgerAccount: true, ledgerTransaction: true }
    });

    console.log(`Analyzing ${entries.length} entries...`);

    const revenueAcc = await prisma.ledgerAccount.findUnique({ where: { code: '4100' } });

    for (const e of entries) {
        const desc = (e.description || e.ledgerTransaction.description || "").toLowerCase();
        const loanNum = loanMap.get(e.ledgerTransaction.referenceId as string);

        let targetAccId = null;

        if (desc.includes('principal') || desc.includes('disbursement') || desc.includes('offset') || desc.includes('repayment')) {
            targetAccId = portfolioAcc.id;
        } else if (desc.includes('interest')) {
            targetAccId = interestAcc.id;
        } else if (desc.includes('fee') || desc.includes('insurance') || desc.includes('charge')) {
            targetAccId = revenueAcc?.id;
        }

        if (targetAccId && targetAccId !== e.ledgerAccountId) {
            console.log(`Migrating entry ${e.id} for ${loanNum}: Moving to ${targetAccId === portfolioAcc.id ? 'Portfolio' : targetAccId === interestAcc.id ? 'Interest' : 'Revenue'} | Old Acc: ${e.ledgerAccount.code} | Desc: ${e.description}`);
            await prisma.ledgerEntry.update({
                where: { id: e.id },
                data: { ledgerAccountId: targetAccId }
            });
        }
    }

    console.log('--- REPAIR COMPLETE ---');
}

migrateAllLoanEntries()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
