import { db } from '@/lib/db'
import { MemberStatus } from '@prisma/client'

/**
 * Fineract-Grade Business Rules Engine
 * Encapsulates complex logic for Member eligibility and validation.
 */
export class MemberRules {

    /**
     * Check if a member is fully active and compliant
     */
    static async isMemberActive(memberId: string): Promise<boolean> {
        const member = await db.member.findUnique({
            where: { id: memberId },
            select: { status: true }
        })
        return member?.status === MemberStatus.ACTIVE
    }

    /**
     * Check if a member can guarantee a loan
     * Rules:
     * 1. Must be ACTIVE
     * 2. Cannot guarantee own loan (Checked in WriteService/Caller usually, but good to have helper)
     * 3. Must have sufficient shares/savings (Optional rule)
     */
    static async canGuaranteeLoan(guarantorId: string, borrowerId: string): Promise<{ allowed: boolean; reason?: string }> {
        if (guarantorId === borrowerId) {
            return { allowed: false, reason: "Member cannot guarantee their own loan" }
        }

        const guarantor = await db.member.findUnique({
            where: { id: guarantorId },
            select: { status: true, contributionBalance: true }
        })

        if (!guarantor) {
            return { allowed: false, reason: "Guarantor not found" }
        }

        if (guarantor.status !== MemberStatus.ACTIVE) {
            return { allowed: false, reason: "Guarantor is not ACTIVE" }
        }

        // Fineract allows configuring if guarantor needs specific balance.
        // For now, we just enforce Active status.

        return { allowed: true }
    }

    /**
     * Check if member is eligible for a loan
     * Rules:
     * 1. Active for X months?
     * 2. No active overdue loans?
     */
    static async isEligibleForLoan(memberId: string): Promise<{ eligible: boolean; reason?: string }> {
        const member = await db.member.findUnique({
            where: { id: memberId },
            select: { status: true }
        })

        if (member?.status !== MemberStatus.ACTIVE) {
            return { eligible: false, reason: "Member account is not ACTIVE" }
        }

        // Check for Overdue Loans
        const overdueLoans = await db.loan.count({
            where: {
                memberId,
                status: 'OVERDUE'
            }
        })

        if (overdueLoans > 0) {
            return { eligible: false, reason: "Member has overdue loans" }
        }

        return { eligible: true }
    }
}
