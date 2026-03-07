import { db as prisma } from '@/lib/db'
import { getMemberContributionBalance } from '@/lib/accounting/AccountingEngine'
import { getSaccoSettings } from '@/app/sacco-settings-actions'
import { processTransactions } from '@/lib/statementProcessor'
import { addMoney, truncateToDecimals, subtractMoney } from '@/lib/currency'

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
                        status: { in: ['APPROVED', 'DISBURSED', 'ACTIVE', 'OVERDUE'] }
                    },
                    include: {
                        transactions: true // Needed for accurate balance calculation
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
    const shareCapital = truncateToDecimals(await getMemberContributionBalance(memberId).catch(() => 0))

    const loanLimitMultiplier = truncateToDecimals(Number(settings.loanMultiplier))

    // Current Exposure: Sum of outstandingBalance on all active loans from Ledger
    let currentExposure = 0

    for (const loan of member.loans) {
        let loanBalance = 0;

        try {
            // Re-calculate balance using statement logic for consistency with Loans Tab & Qualification
            const rawTransactions = (loan as any).transactions ? (loan as any).transactions.map((tx: any) => ({
                ...tx,
                amount: Number(tx.amount),
                createdAt: tx.postedAt,
                type: tx.type
            })) : [];

            if (rawTransactions.length > 0) {
                const mappedTransactions = rawTransactions.map((tx: any) => ({
                    ...tx,
                    type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                        tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                            tx.type
                }));
                const rows = processTransactions(mappedTransactions);
                loanBalance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
            } else {
                // Fallback: use net disbursement or original amount
                // This covers cases where disbursement happened but no transaction record exists yet
                loanBalance = Number(loan.netDisbursementAmount || loan.amount || 0);
            }
        } catch (error) {
            // Fallback on error
            loanBalance = Number(loan.netDisbursementAmount || loan.amount || 0);
        }

        // Add to total exposure (using safe currency addition)
        currentExposure = addMoney(currentExposure, Math.max(0, loanBalance));
    }

    const grossLimit = truncateToDecimals(shareCapital * loanLimitMultiplier)
    const netQualifyingAmount = Math.max(0, subtractMoney(grossLimit, currentExposure))

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
