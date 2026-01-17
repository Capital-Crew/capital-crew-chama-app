/**
 * Dashboard Statistics Actions
 * 
 * Server actions for fetching group-wide dashboard metrics
 * All balances are calculated in REAL-TIME from the General Ledger
 */

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getLoanPrincipalBalance, getLoanInterestBalance, getLoanPenaltyBalance } from '@/lib/accounting/AccountingEngine'

import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
// ... existing imports ...

// ... existing code ...

export async function getDashboardStats(): Promise<Serialized<any>> {
    const session = await auth()
    if (!session) {
        throw new Error('Unauthorized')
    }

    // Cast to any to access accounting models
    const prisma = db as any

    // 1. Fetch Members first to ensure we only sum valid member contributions
    const allMembers = await prisma.member.findMany({
        select: {
            id: true,
            name: true
        }
    })
    const memberIds = allMembers.map((m: any) => m.id)

    // 0. Get Correct Account Code for CONTRIBUTIONS
    const contributionMapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' },
        include: { account: true }
    })
    const contributionAccountCode = contributionMapping?.account.code || '3000'

    // Fetch remaining data in parallel
    const [
        allLoans,
        contributionsAgg,
        contributorStats
    ] = await Promise.all([
        prisma.loan.findMany({
            select: {
                id: true,
                memberId: true,
                amount: true,
                status: true
            }
        }),
        // REAL-TIME: Total Contributions (Sum of all Member Balances)
        prisma.ledgerEntry.aggregate({
            where: {
                ledgerAccount: { code: contributionAccountCode },
                ledgerTransaction: {
                    isReversed: false,
                    referenceType: 'SHARE_CONTRIBUTION',
                    referenceId: { in: memberIds }
                }
            },
            _sum: { debitAmount: true, creditAmount: true }
        }),
        // Top Contributors by share capital (from ledger)
        prisma.ledgerTransaction.groupBy({
            by: ['referenceId'],
            where: {
                referenceType: 'SHARE_CONTRIBUTION',
                isReversed: false,
                referenceId: { in: memberIds }
            },
            _sum: { totalAmount: true },
            orderBy: {
                _sum: { totalAmount: 'desc' }
            },
            take: 5
        })
    ])

    // Helper to calculate balance from aggregation
    const getBalance = (agg: { _sum: { debitAmount: any, creditAmount: any } }, type: 'DEBIT_NORMAL' | 'CREDIT_NORMAL') => {
        const debit = Number(agg._sum.debitAmount || 0)
        const credit = Number(agg._sum.creditAmount || 0)
        return type === 'DEBIT_NORMAL' ? debit - credit : credit - debit
    }

    // 1. REAL-TIME Total Contributions (cumulative from all members via ledger)
    // Account 1200 is a LIABILITY/EQUITY (Member Fund). 
    // Contributions are CREDITS.
    const totalContributions = getBalance(contributionsAgg, 'CREDIT_NORMAL')

    // 2. Total Loans Disbursed (all principal amounts ever issued)
    // This is historical data - sum of all loan amounts that were disbursed
    const totalLoansIssued = allLoans
        .filter((l: any) => ['DISBURSED', 'ACTIVE', 'OVERDUE', 'CLEARED'].includes(l.status))
        .reduce((sum: number, l: any) => sum + Number(l.amount), 0)

    // 3. REAL-TIME Outstanding Loans (active loans with actual balance > 0 from ledger)
    // This calculates Principal + Interest + Penalties for each active loan
    let outstandingLoans = 0
    const activeLoans = allLoans.filter((l: any) => ['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(l.status))

    console.log(`[Dashboard] Calculating outstanding balances for ${activeLoans.length} active loans...`)

    for (const loan of activeLoans) {
        try {
            // Get real-time balances from ledger (Principal + Interest + Penalties)
            const [principal, interest, penalty] = await Promise.all([
                getLoanPrincipalBalance(loan.id),
                getLoanInterestBalance(loan.id),
                getLoanPenaltyBalance(loan.id)
            ])

            const totalBalance = principal + interest + penalty

            if (totalBalance > 0) {
                outstandingLoans += totalBalance
                console.log(`[Dashboard] Loan ${loan.id}: P=${principal}, I=${interest}, Pen=${penalty}, Total=${totalBalance}`)
            }
        } catch (error) {
            // Fallback to loan amount if ledger not available
            console.warn(`[Dashboard] Could not get ledger balance for loan ${loan.id}, using amount:`, error)
            const fallbackAmount = Number(loan.amount)
            outstandingLoans += fallbackAmount
        }
    }

    console.log(`[Dashboard] Total Outstanding Loans: ${outstandingLoans}`)

    // 4. REAL-TIME Top 5 Borrowers (by current outstanding balances from ledger)
    const memberLoanTotals = new Map<string, { name: string; amount: number }>()

    for (const loan of activeLoans) {
        const member = (allMembers as any[]).find((m: any) => m.id === loan.memberId)
        if (member) {
            try {
                // Get real-time balance from ledger
                const [principal, interest, penalty] = await Promise.all([
                    getLoanPrincipalBalance(loan.id),
                    getLoanInterestBalance(loan.id),
                    getLoanPenaltyBalance(loan.id)
                ])

                const totalBalance = principal + interest + penalty

                if (totalBalance > 0) {
                    const existing = memberLoanTotals.get(member.id)
                    if (existing) {
                        existing.amount += totalBalance
                    } else {
                        memberLoanTotals.set(member.id, { name: member.name, amount: totalBalance })
                    }
                }
            } catch (error) {
                // Fallback to loan amount
                console.warn(`[Dashboard] Could not get ledger balance for borrower ${member.name}, using amount`)
                const loanAmount = Number(loan.amount)
                const existing = memberLoanTotals.get(member.id)
                if (existing) {
                    existing.amount += loanAmount
                } else {
                    memberLoanTotals.set(member.id, { name: member.name, amount: loanAmount })
                }
            }
        }
    }

    const topBorrowers = Array.from(memberLoanTotals.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

    // Map top contributors (real-time from ledger)
    const topContributors = (contributorStats as any[]).map((stat: any) => {
        const member = (allMembers as any[]).find((m: any) => m.id === stat.referenceId)
        return {
            name: member?.name || 'Unknown Member',
            amount: Number(stat._sum.totalAmount || 0)
        }
    })

    return serializeFinancials({
        totalContributions,
        totalLoansIssued,
        outstandingLoans,
        topContributors,
        topBorrowers
    })
}

/**
 * Fetch Monthly Trends for Charts (Last 12 Months)
 */
export async function getMonthlyTrends(): Promise<Serialized<any[]>> {
    // We can't easily group by month with Prisma in a DB-agnostic way without raw queries.
    // For simplicity/stability with diverse DBs (Postgres/MySQL/SQLite), we will fetch raw dates and aggregate in JS.
    // Or simpler: Iterate last 12 months and run 12 fast aggregates.

    const prisma = db as any;

    const today = new Date();
    const trends = [];

    // Get Contribution Account
    const contributionMapping = await prisma.systemAccountingMapping.findUnique({ where: { type: 'CONTRIBUTIONS' }, include: { account: true } });
    const contributionCode = contributionMapping?.account.code || '3000';

    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        const startOfMonth = new Date(year, d.getMonth(), 1);
        const endOfMonth = new Date(year, d.getMonth() + 1, 0);

        // 1. Monthly Contributions
        const contrib = await prisma.ledgerEntry.aggregate({
            where: {
                ledgerAccount: { code: contributionCode },
                ledgerTransaction: {
                    isReversed: false,
                    referenceType: 'SHARE_CONTRIBUTION',
                    transactionDate: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            },
            _sum: { creditAmount: true, debitAmount: true }
        });
        const netContrib = Number(contrib._sum.creditAmount || 0) - Number(contrib._sum.debitAmount || 0);

        // 2. Monthly Loan Disbursements
        const loans = await prisma.loan.aggregate({
            where: {
                disbursementDate: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                status: { in: ['ACTIVE', 'CLEARED', 'OVERDUE', 'DISBURSED'] }
            },
            _sum: { amount: true }
        });
        const disbursed = Number(loans._sum.amount || 0);

        trends.push({
            name: `${monthName}`,
            contributions: netContrib,
            loans: disbursed
        });
    }

    return serializeFinancials(trends);
}
