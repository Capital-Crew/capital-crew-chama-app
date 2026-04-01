import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkArrears() {
    console.log("Fetching loans...");
    
    // Fetch loans that are ACTIVE or OVERDUE
    const loans = await prisma.loan.findMany({
        where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
        include: { repaymentInstallments: { orderBy: { dueDate: 'asc' } } },
        take: 5
    });

    console.log(`Found ${loans.length} loans to analyze.\n`);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log(`TODAY DATE USED FOR CALCULATION: ${today.toISOString()}`);

    for (const loan of loans) {
        console.log(`\n\n=== LOAN: ${loan.loanApplicationNumber} | Status: ${loan.status} ===`);
        
        let sched = [];
        if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
            sched = loan.repaymentInstallments;
            console.log("Source: DB repaymentInstallments");
        } else if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
            sched = loan.repaymentSchedule;
            console.log("Source: JSON repaymentSchedule");
        } else {
            console.log("NO SCHEDULE FOUND!");
            continue;
        }

        const normalisedSched = sched.map(s => {
            const totalDue = Number(s.totalDue || s.total || s.principalDue || s.principal || 0) + Number(s.interestDue || s.interest || 0);
            const pPaid = Number(s.principalPaid ?? 0);
            const iPaid = Number(s.interestPaid ?? 0);
            const amountPaid = Number(s.amountPaid || s.paid || 0) || (pPaid + iPaid);
            const d = new Date(s.dueDate || s.date);
            
            let status = s.status ? String(s.status).toUpperCase() : '';
            if (!status) {
                if (s.isFullyPaid || amountPaid >= totalDue) status = 'PAID';
                else if (d > today) status = amountPaid > 0 ? 'PARTIAL' : 'UPCOMING';
                else status = amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
            } else if (status === 'FULLY_PAID') {
                status = 'PAID';
            }

            return {
                installmentNumber: Number(s.installmentNumber || s.installment || 0),
                dueDate: d,
                totalDue,
                amountPaid,
                outstanding: Math.max(0, totalDue - amountPaid),
                status
            };
        }).sort((a, b) => a.installmentNumber - b.installmentNumber);

        console.log("Normalised Schedule:");
        normalisedSched.forEach(s => {
            const isPastDue = s.dueDate < today;
            const flag = isPastDue && s.outstanding > 0 ? " [IN ARREARS]" : "";
            console.log(`  Inst ${s.installmentNumber} | Due: ${s.dueDate.toISOString().split('T')[0]} (Past? ${isPastDue}) | TotalDue: ${s.totalDue} | Paid: ${s.amountPaid} | Out: ${s.outstanding} | Status: ${s.status}${flag}`);
        });

        const currentInst = normalisedSched.find(s => s.outstanding > 0);
        const monthlyDue = currentInst ? currentInst.totalDue : 0;

        const specArrears = Math.max(0, normalisedSched.reduce((sum, s) => {
            if (s.dueDate < today && s.outstanding > 0) {
                return sum + s.outstanding;
            }
            return sum;
        }, 0));

        console.log(`\nRESULTS:`);
        console.log(`  Monthly Due: ${monthlyDue}`);
        console.log(`  Arrears: ${specArrears}`);
    }
}

checkArrears()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
