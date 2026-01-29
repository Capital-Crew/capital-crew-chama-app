
import { searchLoans } from '../app/actions/loan-adjustment-actions';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugSearch() {
    for (const ln of ['LN005', 'LN010']) {
        console.log(`--- Debugging searchLoans("${ln}") ---`);
        const results = await searchLoans(ln);
        console.log('Search Results:', JSON.stringify(results, null, 2));

        console.log('\n--- Raw DB Check (Loan Table) ---');
        const loans = await prisma.loan.findMany({
            where: { loanApplicationNumber: ln },
            select: {
                id: true,
                loanApplicationNumber: true,
                outstandingBalance: true,
                status: true
            }
        });
        console.log('Raw DB Loans:', JSON.stringify(loans, null, 2));
    }
}

debugSearch()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
