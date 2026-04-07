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
        const member = await db.member.findUnique({
            where: { id },
            select: {
                id: true,
                memberNumber: true,
                name: true,
                status: true,
                branch: { select: { name: true } },
                wallet: { select: { glAccount: { select: { balance: true } } } },
                contributionBalance: true
            }
        })
        return member
    }
}
