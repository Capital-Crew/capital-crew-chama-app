import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Service for Reading Member Data
 * Optimized for performance, no side effects.
 */
export class MemberReadService {

    /**
     * Get full member profile
     */
    static async getMemberProfile(id: string) {
        return db.member.findUnique({
            where: { id },
            include: {
                details: true,
                contactInfo: true,
                identifiers: true,
                branch: true,
                wallet: true,
                loans: {
                    select: {
                        id: true,
                        loanApplicationNumber: true,
                        status: true,
                        amount: true
                    }
                }
            }
        })
    }

    /**
     * Search members with pagination
     */
    static async searchMembers(
        query?: string,
        status?: string,
        page = 1,
        pageSize = 20
    ) {
        const skip = (page - 1) * pageSize

        const where: Prisma.MemberWhereInput = {}

        // Soft delete check
        where.deletedAt = null

        if (status) { // ANY cast because status is Enum
            (where as any).status = status
        }

        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { memberNumber: { equals: parseInt(query) || -1 } },
                { externalId: { contains: query, mode: 'insensitive' } },
                // Allow searching by contact details if needed, usually expensive join
                // { details: { firstName: { contains: query } } }
            ]
        }

        const [data, total] = await Promise.all([
            db.member.findMany({
                where,
                skip,
                take: pageSize,
                include: {
                    details: true,
                    branch: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            db.member.count({ where })
        ])

        return {
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        }
    }

    static async getMemberSummary(id: string) {
        const { getMemberWalletBalance, getMemberContributionBalance, getLoanOutstandingBalance } = await import('@/lib/accounting/AccountingEngine');

        const [member, activeLoans, walletBalance, contributionBalance] = await Promise.all([
            db.member.findUnique({
                where: { id },
                select: {
                    id: true,
                    memberNumber: true,
                    name: true,
                    status: true,
                    branch: { select: { name: true } },
                }
            }),
            db.loan.findMany({
                where: { memberId: id, status: { in: ['ACTIVE', 'OVERDUE'] } },
                select: { id: true }
            }),
            getMemberWalletBalance(id).catch(() => 0),
            getMemberContributionBalance(id).catch(() => 0)
        ]);

        if (!member) return null;

        let totalLoansOutstanding = 0;
        if (activeLoans.length > 0) {
            const balances = await Promise.all(activeLoans.map(l => getLoanOutstandingBalance(l.id).catch(() => 0)));
            totalLoansOutstanding = balances.reduce((sum, bal) => sum + bal, 0);
        }

        return {
            ...member,
            walletBalance,
            contributionBalance,
            totalLoansActive: activeLoans.length,
            totalLoansOutstanding
        };
    }
}
