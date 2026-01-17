
import { db } from '@/lib/db';

async function main() {
    const loanNumber = 'LN-202601-002';
    console.log(`Searching for loan ${loanNumber}...`);

    const loan = await db.loan.findFirst({
        where: { loanApplicationNumber: loanNumber }
    });

    if (!loan) {
        console.error('Loan not found!');
        return;
    }

    console.log(`Found Loan ID: ${loan.id}`);
    console.log(`Stored current_balance: ${loan.current_balance}`);

    // Fetch Journal Lines
    const lines = await db.journalLine.findMany({
        where: {
            journalEntry: {
                referenceId: loan.id,
                isReversed: false
            }
        },
        include: {
            account: true,
            journalEntry: true
        },
        orderBy: {
            journalEntry: { transactionDate: 'asc' }
        }
    });

    console.log(`\n--- JOURNAL LINES (All Accounts) ---`);
    console.table(lines.map(l => ({
        Date: l.journalEntry.transactionDate.toISOString().split('T')[0],
        Desc: l.description || l.journalEntry.description,
        Account: `${l.account.code} - ${l.account.name} (${l.account.type})`,
        Debit: Number(l.debitAmount),
        Credit: Number(l.creditAmount)
    })));

    // Calculate Asset Balance (Standard Portfolio Logic)
    let assetBalance = 0;
    let assetDetails = [];

    for (const l of lines) {
        if (l.account.type === 'ASSET') {
            const amount = Number(l.debitAmount) - Number(l.creditAmount);
            assetBalance += amount;
            assetDetails.push({
                Account: l.account.name,
                Amount: amount,
                Running: assetBalance
            });
        }
    }

    console.log(`\n--- ASSET BALANCE CALCULATION ---`);
    console.table(assetDetails);
    console.log(`\nTOTAL CALCULATED ASSET BALANCE: ${assetBalance}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
