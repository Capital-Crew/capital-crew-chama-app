
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                member: true,
                loanProduct: true
            }
        });

        console.log('----- LOAN DEBUG REPORT -----');
        console.log(`Total Loans Found: ${loans.length}`);

        if (loans.length === 0) {
            console.log('No loans found in the database.');
        }

        loans.forEach(l => {
            console.log(`Loan #${l.loanApplicationNumber}`);
            console.log(`  - ID: ${l.id}`);
            console.log(`  - Member: ${l.member.name} (${l.member.id})`);
            console.log(`  - Status: ${l.status}`);
            console.log(`  - Amount: ${l.amount}`);
            console.log('-----------------------------');
        });

    } catch (error) {
        console.error('Error running debug script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
