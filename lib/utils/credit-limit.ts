import prisma from '@/lib/prisma'
import { getMemberContributionBalance, getLoanOutstandingBalance } from '@/lib/accounting/AccountingEngine'
import { getSaccoSettings } from '@/app/sacco-settings-actions'

export interface CreditSnapshot {
    memberId: string
    memberName: string
    memberNumber: string
    shareCapital: number
    currentExposure: number
    grossLimit: number
    netQualifyingAmount: number
    loanLimitMultiplier: number
}

/**
 * Calculate the borrowing power snapshot for a member
 * Uses Consolidated Ledger Accounts:
 * - Qualifying Shares/Contributions: GL 1200 (CONTRIBUTIONS_LOANS)
 */
export async function calculateBorrowingPower(memberId: string): Promise<CreditSnapshot> {
    const [member, settings] = await Promise.all([
        prisma.member.findUnique({
            where: { id: memberId },
            include: {
                loans: {
                    where: {
                        status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
                    }
                }
            }
        }),
        getSaccoSettings()
    ])

    if (!member) {
        throw new Error('Member not found')
    }

    // Total Savings: Qualifying Contributions (GL 1200)
    // This is the correct consolidated balance to use for Credit Limits
    const shareCapital = await getMemberContributionBalance(memberId).catch(() => 0)

    const loanLimitMultiplier = Number(settings.loanMultiplier)

    // Current Exposure: Sum of outstandingBalance on all active loans from Ledger
    let currentExposure = 0
    for (const loan of member.loans) {
        const balance = await getLoanOutstandingBalance(loan.id).catch(() => 0)
        currentExposure += balance
    }

    const grossLimit = shareCapital * loanLimitMultiplier
    const netQualifyingAmount = Math.max(0, grossLimit - currentExposure)

    return {
        memberId: member.id,
        memberName: member.name,
        memberNumber: `MB-${member.memberNumber.toString().padStart(3, '0')}`,
        shareCapital,
        currentExposure,
        grossLimit,
        netQualifyingAmount,
        loanLimitMultiplier
    }
}
