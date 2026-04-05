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

export async function getDashboardStatsSync(): Promise<Serialized<any>> {
    const session = await auth()
    if (!session) {
        throw new Error('Unauthorized')
    }

    const prisma = db as any

    // 1. Fetch Members mapping
    const allMembers = await prisma.member.findMany({
        select: { id: true, name: true }
    })
    const memberMap = new Map(allMembers.map((m: any) => [m.id, m.name]))

    // 2. Parallel Fetching of Data
    const [
        contributionsAgg,
        loansAmountAgg,
        repaymentsAgg,
        delinquentInstallments,
        missedTrackers
    ] = await Promise.all([
        // A. Total Contributions (Account mapping)
        prisma.ledgerEntry.aggregate({
            where: {
                ledgerAccount: { systemMappings: { some: { type: 'CONTRIBUTIONS' } } },
            },
            _sum: { debitAmount: true, creditAmount: true }
        }),

        // B. Total Outstanding Loans (Calculated from Loan records as source of truth)
        prisma.loan.aggregate({
            where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
            _sum: { amount: true }
        }),
        // C. Total Repayments (to subtract from disbursements)
        prisma.loanTransaction.findMany({
          where: {
            type: 'REPAYMENT',
            loan: { status: { in: ['ACTIVE', 'OVERDUE'] } }
          },
          select: { principalAmount: true }
        }),

        // D. Delinquent Loan Installments (passed due date and not fully paid)
        prisma.repaymentInstallment.findMany({
            where: {
                dueDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
                isFullyPaid: false,
                loan: { status: { in: ['ACTIVE', 'OVERDUE'] } }
            },
            include: {
                loan: {
                    select: {
                        loanApplicationNumber: true,
                        member: { select: { name: true, id: true } }
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        }),

        // E. Contribution Arrears (from MonthlyTracker)
        prisma.monthlyTracker.findMany({
            where: {
                balance: { gt: 0 },
                month: { lte: new Date() }
            },
            include: {
                member: { select: { name: true, id: true } }
            },
            orderBy: { month: 'asc' }
        })
    ])

    // --- AGGREGATION ---

    // 1. Financial Totals
    const totalContributions = Number(contributionsAgg._sum.creditAmount || 0) - Number(contributionsAgg._sum.debitAmount || 0)
    const totalRepaidPrincipal = (repaymentsAgg as any[]).reduce((sum, r) => sum + Number(r.principalAmount || 0), 0)
    const outstandingLoans = Number(loansAmountAgg._sum.amount || 0) - totalRepaidPrincipal

    // 2. Aggregate Delinquent Loans
    const loanArrearsMap = new Map<string, any>()
    delinquentInstallments.forEach((inst: any) => {
        const loanId = inst.loanId
        const arrears = Number(inst.principalDue) + Number(inst.interestDue) + Number(inst.penaltyDue) + Number(inst.feeDue)
                        - (Number(inst.principalPaid) + Number(inst.interestPaid) + Number(inst.penaltyPaid) + Number(inst.feesPaid))
        
        if (loanArrearsMap.has(loanId)) {
            const existing = loanArrearsMap.get(loanId)
            existing.arrears += arrears
            // Keep the earliest due date for "Days Overdue"
            if (new Date(inst.dueDate) < new Date(existing.earliestDueDate)) {
                existing.earliestDueDate = inst.dueDate
            }
        } else {
            loanArrearsMap.set(loanId, {
                loanId: inst.loanId,
                loanNumber: inst.loan.loanApplicationNumber,
                memberName: inst.loan.member.name,
                memberId: inst.loan.member.id,
                arrears: arrears,
                earliestDueDate: inst.dueDate
            })
        }
    })

    const delinquentLoans = Array.from(loanArrearsMap.values()).map(l => ({
        ...l,
        daysOverdue: Math.floor((Date.now() - new Date(l.earliestDueDate).getTime()) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => b.arrears - a.arrears).slice(0, 5)

    // 3. Aggregate Contribution Arrears
    const memberContributionArrearsMap = new Map<string, any>()
    missedTrackers.forEach((track: any) => {
        const mid = track.memberId
        if (memberContributionArrearsMap.has(mid)) {
            const existing = memberContributionArrearsMap.get(mid)
            existing.arrears += Number(track.balance)
        } else {
            memberContributionArrearsMap.set(mid, {
                memberId: mid,
                memberName: track.member.name,
                arrears: Number(track.balance),
                lastMissed: track.month
            })
        }
    })

    const contributionArrears = Array.from(memberContributionArrearsMap.values())
        .sort((a, b) => b.arrears - a.arrears)
        .slice(0, 5)

    return serializeFinancials({
        totalContributions,
        outstandingLoans,
        delinquentLoans,
        contributionArrears
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
                    systemMappings: {
                        some: { type: 'CONTRIBUTIONS' }
                    }
                },
                ledgerTransaction: {
                    referenceType: 'SHARE_CONTRIBUTION',
                    isReversed: false,
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

/**
 * Fetch Ledger KPI Totals for the dashboard (Assets, Liabilities, Revenue, Net Position)
 */
export async function getLedgerKPIs(): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const prisma = db as any

    const accounts = await prisma.ledgerAccount.findMany({
        where: {
            status: 'ACTIVE',
            type: { in: ['ASSET', 'LIABILITY', 'REVENUE', 'EQUITY', 'EXPENSE'] }
        },
        select: { type: true, balance: true }
    })

    let totalAssets = 0
    let totalLiabilities = 0
    let totalRevenue = 0
    let totalEquity = 0
    let totalExpenses = 0

    accounts.forEach((a: any) => {
        const bal = Number(a.balance || 0)
        if (a.type === 'ASSET') totalAssets += bal
        else if (a.type === 'LIABILITY') totalLiabilities += bal
        else if (a.type === 'REVENUE') totalRevenue += bal
        else if (a.type === 'EQUITY') totalEquity += bal
        else if (a.type === 'EXPENSE') totalExpenses += bal
    })

    const netPosition = totalAssets - totalLiabilities

    return serializeFinancials({ totalAssets, totalLiabilities, totalRevenue, totalExpenses, totalEquity, netPosition })
}

