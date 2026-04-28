import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getMemberWalletBalance, getMemberContributionBalance, getLoanOutstandingBalance } from '@/services/payment-gateway';

export class ProjectionService {
    /**
     * Re-aggregates a member's entire balance profile and updates the projection.
     */
    static async syncMember(memberId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;

        // 1. Fetch current totals from authoritative ledger
        const [walletBalance, contributionBalance] = await Promise.all([
            getMemberWalletBalance(memberId, client),
            getMemberContributionBalance(memberId, client)
        ]);

        // 2. Fetch loan aggregation
        const loans = await client.loan.findMany({
            where: { memberId },
            select: { id: true, status: true }
        });

        const activeLoanCount = loans.filter(l => ['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(l.status)).length;
        
        let totalOutstanding = 0;
        for (const loan of loans) {
            if (['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
                totalOutstanding += await getLoanOutstandingBalance(loan.id, client);
            }
        }

        // 3. Upsert projection
        return await client.memberBalanceProjection.upsert({
            where: { memberId },
            create: {
                memberId,
                walletBalance,
                contributionBalance,
                totalLoansActive: activeLoanCount,
                totalLoansOutstanding: totalOutstanding,
                lastEventId: 'SYNC',
                lastUpdated: new Date()
            },
            update: {
                walletBalance,
                contributionBalance,
                totalLoansActive: activeLoanCount,
                totalLoansOutstanding: totalOutstanding,
                lastUpdated: new Date()
            }
        });
    }

    /**
     * Re-aggregates a loan's financial summary and copies authoritative status.
     */
    static async syncLoan(loanId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;

        // 1. Fetch authoritative status and details from Loan model
        const loan = await client.loan.findUnique({
            where: { id: loanId },
            select: { status: true, amount: true }
        });

        if (!loan) throw new Error(`Loan ${loanId} not found for projection sync`);

        // 2. Fetch authoritative balance from Ledger
        const outstandingBalance = await getLoanOutstandingBalance(loanId, client);

        // 3. Fetch repayment stats
        const installments = await client.repaymentInstallment.findMany({
            where: { loanId },
            select: { principalPaid: true, interestPaid: true }
        });

        const totalRepaid = installments.reduce((acc, inst) => 
            acc + Number(inst.principalPaid) + Number(inst.interestPaid), 0
        );

        // 4. Upsert projection
        return await client.loanSummaryProjection.upsert({
            where: { loanId },
            create: {
                loanId,
                totalDisbursed: Number(loan.amount),
                totalRepaid,
                outstandingBalance,
                status: loan.status,
                lastEventId: 'SYNC',
                lastUpdated: new Date()
            },
            update: {
                totalRepaid,
                outstandingBalance,
                status: loan.status,
                lastUpdated: new Date()
            }
        });
    }
}
