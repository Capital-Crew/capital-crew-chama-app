'use server'

import { db } from '@/lib/db'
import { unstable_noStore as noStore } from 'next/cache'
import { mapLoanToTableRow } from '@/services/loan-mapper';
import { MemberLoanTableRow } from '@/types/loan-table';

/**
 * Fetch real-time member statistics for the Member Snapshot
 * explicitly opting out of caching for fresh data.
 */
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
// ... existing imports ...

/**
 * Fetch real-time member statistics for the Member Snapshot
 * explicitly opting out of caching for fresh data.
 */
export async function getMemberRealtimeStats(memberId: string): Promise<Serialized<any>> {
    noStore()

    const member = await db.member.findUnique({
        where: { id: memberId },
        select: {
            id: true,
            memberNumber: true,
            name: true,
            details: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    })

    if (!member) return null

    // Helper to get aggregated ledger balance
    async function getLedgerBalance(code: string) {
        const result = await db.ledgerEntry.aggregate({
            _sum: {
                creditAmount: true,
                debitAmount: true
            },
            where: {
                ledgerAccount: { code },
                ledgerTransaction: {
                    referenceId: memberId,
                    isReversed: false
                }
            }
        })
        // Liabilities/Equity (Shares/Deposits) are Credit Normal. Balance = Credit - Debit.
        const credit = Number(result._sum.creditAmount || 0)
        const debit = Number(result._sum.debitAmount || 0)
        return credit - debit
    }

    // Parallel fetch for speed
    const [
        shareCapital, // Now Contributions (1200)
        walletBalance, // Member Wallet (2200)
        loans
    ] = await Promise.all([
        getLedgerBalance('1200'), // Contributions & Loans
        getLedgerBalance('2200'), // Member Wallet
        db.loan.aggregate({
            _sum: {
                current_balance: true
            },
            where: {
                memberId: memberId,
                status: {
                    in: ['DISBURSED', 'ACTIVE', 'OVERDUE']
                    // Exclude CLEARED, REJECTED, CANCELLED, PENDING_APPROVAL
                    // Assuming 'ACTIVE' covers it if used, or DISBURSED.
                    // LoanStatus enum has: DISBURSED, ACTIVE, OVERDUE?
                    // Checked schema: DISBURSED, ACTIVE, OVERDUE exist.
                }
            }
        })
    ])

    const totalContributions = shareCapital + walletBalance
    const cumulativeLoanBalance = loans._sum.current_balance || 0

    // Fallback name logic if details not populated
    let name = member.name
    if (member.details?.firstName && member.details?.lastName) {
        name = `${member.details.firstName} ${member.details.lastName}`.toUpperCase()
    }

    return serializeFinancials({
        identity: {
            firstName: member.details?.firstName || member.name.split(' ')[0],
            lastName: member.details?.lastName || member.name.split(' ').slice(1).join(' '),
            fullName: name,
            memberNumber: member.memberNumber
        },
        financials: {
            // Individual balances for real-time display
            memberSavings: walletBalance,           // Member Wallet (2200)
            contributions: shareCapital,             // Share Capital (1200)
            outstandingLoans: cumulativeLoanBalance, // Sum of active loans

            // Legacy combined values (kept for backward compatibility)
            totalContributions,
            cumulativeLoanBalance
        }
    })
}

/**
 * Fetch member's full loan history for the detailed table.
 */

export async function getAllMemberLoans(memberId: string): Promise<Serialized<MemberLoanTableRow[]>> {
    if (!memberId) return [];
    noStore(); // Real-time enforcement

    try {
        const loans = await db.loan.findMany({
            where: { memberId },
            orderBy: { disbursementDate: 'desc' },
            include: {
                member: true,
                loanProduct: true
            }
        });

        // Use the centralized mapper for consistent logic
        return serializeFinancials(loans.map(loan => mapLoanToTableRow(loan)));
    } catch (error) {
        console.error("Error fetching member loans:", error);
        return [];
    }
}
