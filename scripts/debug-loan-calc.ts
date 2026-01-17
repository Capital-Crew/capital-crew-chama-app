
import { db } from '@/lib/db';
import { getLoanPortfolio } from '@/app/actions/member-dashboard-actions';

async function main() {
    const memberId = 'cmjywalx80007tmzwr2y7azwy';
    console.log(`Fetching portfolio for member: ${memberId}`);

    const portfolio = await getLoanPortfolio(memberId);

    console.log(`Found ${portfolio.length} loans.`);

    for (const loan of portfolio) {
        console.log(`\n--- Loan ${loan.loanNumber} ---`);
        console.log(`Balance: ${loan.totalLoanBalance}`);
        console.log(`Arrears: ${loan.arrears}`);
        console.log(`Expected: ${loan.expectedAmount}`);

        // We need to fetch the raw loan to see the schedule, as getLoanPortfolio processes it
        // and might not expose the raw schedule in the return type (it's internal to the calc).
        // Actually, getLoanPortfolio returns the processed object. 
        // But I want to see WHY it calculated what it did.
        // So I will query the DB directly here to inspect the raw JSON.

        const rawLoan = await db.loan.findUnique({
            where: { id: loan.id },
            select: {
                repaymentSchedule: true,
                repaymentInstallments: true, // Check if relation exists
                status: true
            }
        });

        const schedJSON = (rawLoan?.repaymentSchedule as any[]) || [];
        const schedRelation = rawLoan?.repaymentInstallments || [];

        console.log(`JSON Schedule Length: ${schedJSON.length}`);
        console.log(`Pql Relation Length: ${schedRelation.length}`);

        const sched = schedRelation.length > 0 ? schedRelation : schedJSON;

        if (sched.length > 0) {
            console.log('Sample Item:', JSON.stringify(sched[0], null, 2));
        } else {
            console.log('Schedule is EMPTY (Both JSON and Relation).');
        }

        // Re-simulate logic to see what happens
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const overdueItems = sched.filter((i: any) => {
            const d = new Date(i.dueDate || i.date);
            return d < today && !i.isFullyPaid; // Note: !undefined is TRUE.
        });
        console.log(`Overdue Items Count (Calc): ${overdueItems.length}`);

        const currentInstallment = sched.find((i: any) => {
            const d = new Date(i.dueDate || i.date);
            return d >= today;
        });
        console.log(`Current Installment Found: ${!!currentInstallment}`);
        if (currentInstallment) {
            console.log('Current Installment Date:', currentInstallment.dueDate || currentInstallment.date);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await db.$disconnect();
    });
