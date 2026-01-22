
import { db } from "../lib/db";
import { LoanScheduleCache } from "../lib/services/LoanScheduleCache";

async function main() {
    console.log("Starting Loan Cache Priming...");

    const loans = await db.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
        }
    });

    console.log(`Found ${loans.length} loans to cache.`);

    for (const loan of loans) {
        try {
            console.log(`Generating cache for ${loan.loanApplicationNumber}...`);
            await LoanScheduleCache.generateAndSaveSchedule(loan.id);
        } catch (error) {
            console.error(`Failed to cache ${loan.loanApplicationNumber}:`, error);
        }
    }

    console.log("Done.");
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
