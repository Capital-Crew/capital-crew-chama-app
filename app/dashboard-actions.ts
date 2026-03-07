/**
 * Dashboard Statistics Actions
 * 
 * Server actions for fetching group-wide dashboard metrics
 * Optimized for performance using bulk fetching and in-memory aggregation.
 */

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"

export async function getDashboardStats(): Promise<Serialized<any>> {
    const session = await auth()
    if (!session) {
        throw new Error('Unauthorized')
    }

    const prisma = db as any

    // 1. Fetch Members first (Lightweight)
    const allMembers = await prisma.member.findMany({
        select: {
            id: true,
            name: true
        }
    })
    const memberIds = allMembers.map((m: any) => m.id)
    const memberMap = new Map(allMembers.map((m: any) => [m.id, m.name]))

    // 2. Get Contribution Account Code
    const contributionMapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' },
        include: { account: true }
    })
    const contributionAccountCode = contributionMapping?.account.code || '3000'

    // 3. Parallel Fetching of Main Datasets
    const [
        allLoans,
        contributionsAgg,
        contributorStats,
        loanPortfolioAgg,
        topLoansHeuristic
    ] = await Promise.all([
        // A. All Loans (for historical totals)
        prisma.loan.findMany({
            select: {
                id: true,
                memberId: true,
                amount: true,
                status: true
            }
        }),

        // B. Total Contributions (Account 1200 / 3000 mapping)
        prisma.ledgerEntry.aggregate({
            where: {
                ledgerAccount: { code: contributionAccountCode },
            },
            _sum: { debitAmount: true, creditAmount: true }
        }),

        // C. Top Contributors (from ledger)
        prisma.ledgerTransaction.groupBy({
            by: ['referenceId'],
            where: {
                referenceType: 'SHARE_CONTRIBUTION',
                referenceId: { in: memberIds }
            },
            _sum: { totalAmount: true },
            orderBy: {
                _sum: { totalAmount: 'desc' },
            },
            take: 5
        }),

        // D. Outstanding Loans (Using Cached Balances for speed)
        prisma.ledgerAccount.aggregate({
            where: {
                productMappings: { some: { accountType: 'LOAN_PORTFOLIO' } }
            },
            _sum: { balance: true }
        }),

        // E. Top Borrowers Heuristic
        prisma.loan.findMany({
            where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
            orderBy: { outstandingBalance: 'desc' },
            take: 10,
            select: {
                memberId: true,
                outstandingBalance: true,
                member: { select: { name: true } }
            }
        })
    ])

    // --- AGGREGATION & CALCULATIONS ---

    // 1. Total Contributions
    const totalContributions = Number(contributionsAgg._sum.creditAmount || 0) - Number(contributionsAgg._sum.debitAmount || 0)

    // 2. Total Loans Issued (Historical)
    const totalLoansIssued = allLoans
        .filter((l: any) => ['ACTIVE', 'OVERDUE', 'CLEARED'].includes(l.status))
        .reduce((sum: number, l: any) => sum + Number(l.amount), 0)

    const outstandingLoans = Number((loanPortfolioAgg as any)._sum.balance || 0)

    // 4. Top Borrowers (Aggregated from Heuristic)
    const memberLoanTotals = new Map<string, number>()
    topLoansHeuristic.forEach((loan: any) => {
        const current = memberLoanTotals.get(loan.memberId) || 0
        memberLoanTotals.set(loan.memberId, current + Number(loan.outstandingBalance))
    })

    const topBorrowers = Array.from(memberLoanTotals.entries())
        .map(([memberId, amount]) => ({
            name: memberMap.get(memberId) || 'Unknown Member',
            amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

    // 5. Top Contributors
    const topContributors = (contributorStats as any[]).map((stat: any) => {
        return {
            name: memberMap.get(stat.referenceId) || 'Unknown Member',
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
 * Optimized to fetch data in bulk and aggregate in memory.
 */
export async function getMonthlyTrends(): Promise<Serialized<any[]>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const prisma = db as any;

    const today = new Date();
    // Start from 11 months ago (total 12 months including current)
    const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month

    const [contributionEntries, loanDisbursements] = await Promise.all([
        // 1. Bulk Fetch Contributions for date range
        prisma.ledgerEntry.findMany({
            where: {
                ledgerAccount: {
                    // We need to resolve the code, but usually it's stable. 
                    // Better to query by type or fetch mapping first.
                    // For speed, let's fetch mapping ID or just join.
                    // Let's use the relation if possible, or fetch code separate.
                    systemMappings: {
                        some: { type: 'CONTRIBUTIONS' }
                    }
                },
                ledgerTransaction: {
                    referenceType: 'SHARE_CONTRIBUTION',
                    transactionDate: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            select: {
                debitAmount: true,
                creditAmount: true,
                ledgerTransaction: {
                    select: { transactionDate: true }
                }
            }
        }),

        // 2. Bulk Fetch Loan Disbursements
        prisma.loan.findMany({
            where: {
                disbursementDate: {
                    gte: startDate,
                    lte: endDate
                },
                status: { in: ['ACTIVE', 'CLEARED', 'OVERDUE'] }
            },
            select: {
                amount: true,
                disbursementDate: true
            }
        })
    ]);

    // Initialize buckets for the last 12 months
    const trendsMap = new Map<string, { contributions: number, loans: number }>();

    // Create keys for all 12 months
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' }); // "Jan 2025" or just "Jan" to match UI? 
        // Original code used `month: 'short'` so "Jan". But checking year is safer for overlap.
        // Let's stick to simple "Jan" if that's what UI expects, but careful of duplicates if spanning years? 
        // Original code: `const monthName = d.toLocaleString('default', { month: 'short' });`
        // It pushes to array.
        // Let's use "MMM YYYY" as unique key for aggregation, then format name later.
        const uniqueKey = `${d.getFullYear()}-${d.getMonth()}`;
        trendsMap.set(uniqueKey, { contributions: 0, loans: 0 });
    }

    // Aggregate Contributions
    contributionEntries.forEach((entry: any) => {
        const date = new Date(entry.ledgerTransaction.transactionDate);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (trendsMap.has(key)) {
            const val = trendsMap.get(key)!;
            // Credit - Debit
            const net = Number(entry.creditAmount) - Number(entry.debitAmount);
            val.contributions += net;
        }
    });

    // Aggregate Loans
    loanDisbursements.forEach((loan: any) => {
        if (loan.disbursementDate) {
            const date = new Date(loan.disbursementDate);
            const key = `${date.getFullYear()}-${date.getMonth()}`;

            if (trendsMap.has(key)) {
                const val = trendsMap.get(key)!;
                val.loans += Number(loan.amount);
            }
        }
    });

    // Convert to Array
    const trends = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const uniqueKey = `${d.getFullYear()}-${d.getMonth()}`;
        const data = trendsMap.get(uniqueKey) || { contributions: 0, loans: 0 };

        trends.push({
            name: d.toLocaleString('default', { month: 'short' }),
            contributions: data.contributions,
            loans: data.loans
        });
    }

    return serializeFinancials(trends);
}
