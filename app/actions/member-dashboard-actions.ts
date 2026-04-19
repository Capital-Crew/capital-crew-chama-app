'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { MemberStats as MemberDashboardStats, LoanPortfolioItem } from '@/types/member-dashboard';
import { serializePrisma } from '@/lib/serialization';

// --- Types ---

export type MemberFactBoxStats = {
    member: {
        id: string
        memberNumber: number
        name: string
        mobile: string
        status: string
        branchName: string
        category: string // 'Individual'
        email?: string
        beneficiaries: any[]
    }
    financials: {
        contributionBalance: number
        savingsBalance: number
        loanBalance: number
        totalBorrowed: number
        totalPenaltiesPaid: number
        contributionsDue: number
        normalContributions: number
        fosaContributions: number
    }
}

// --- Helpers ---

/**
 * Helper to aggregate account balance for a member from General Ledger
 */
async function getAccountBalance(memberId: string, accountCode: string, normalSide: 'DEBIT' | 'CREDIT') {
    const result = await db.ledgerEntry.aggregate({
        _sum: {
            debitAmount: true,
            creditAmount: true
        },
        where: {
            ledgerAccount: { code: accountCode },
            ledgerTransaction: {
                referenceId: memberId,
                status: 'POSTED'
            }
        }
    })

    const debits = Number(result._sum.debitAmount || 0);
    const credits = Number(result._sum.creditAmount || 0);

    return normalSide === 'DEBIT' ? debits - credits : credits - debits;
}

// --- Server Actions ---

/**
 * Fetch detailed stats for the Member FactBox
 */
export async function getMemberStats(memberId: string): Promise<MemberFactBoxStats | null> {
    try {
        const member = await db.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                memberNumber: true,
                name: true,
                status: true,
                contact: true,
                branch: { select: { name: true } },
                contactInfo: { select: { mobile: true, email: true } },
                nextOfKin: {
                    select: {
                        id: true,
                        fullName: true,
                        relationship: true,
                        allocation: true
                    }
                }
            }
        })

        if (!member) return null

        const { WalletService } = await import('@/lib/services/WalletService')
        const contributionBalance = await getAccountBalance(memberId, '2100', 'CREDIT')
        const savingsBalance = await WalletService.getWalletBalance(memberId)

        const loans = await db.loan.findMany({
            where: { memberId: memberId },
            select: { id: true }
        })
        const loanIds = loans.map(l => l.id)

        let loanBalance = 0
        if (loanIds.length > 0) {
            const loanResult = await db.ledgerEntry.aggregate({
                _sum: { debitAmount: true, creditAmount: true },
                where: {
                    ledgerAccount: { code: '1200' },
                    ledgerTransaction: { referenceId: { in: loanIds } }
                }
            })
            loanBalance = Number(loanResult._sum.debitAmount || 0) - Number(loanResult._sum.creditAmount || 0)
        }

        return {
            member: {
                id: member.id,
                memberNumber: member.memberNumber,
                name: member.name,
                mobile: member.contactInfo?.mobile || member.contact,
                status: member.status,
                branchName: member.branch?.name || 'Main Branch',
                category: 'Individual',
                email: member.contactInfo?.email || undefined,
                beneficiaries: member.nextOfKin?.map((k: any) => ({
                    ...k,
                    allocation: Number(k.allocation)
                })) || []
            },
            financials: {
                contributionBalance,
                savingsBalance,
                loanBalance,
                contributionsDue: 0,
                totalBorrowed: 0,
                totalPenaltiesPaid: 0,
                normalContributions: 0,
                fosaContributions: 0
            }
        }
    } catch (error) {
        return null
    }
}

/**
 * Fetch Exact Member Stats for the Pixel-Perfect Dashboard
 */
export async function getDetailedMemberStats(memberId: string): Promise<{ stats: MemberDashboardStats, loans: LoanPortfolioItem[] } | null> {
    const { LoanScheduleCache } = await import('@/lib/services/LoanScheduleCache');
    const { getLoanPenaltyBalance } = await import('@/lib/accounting/AccountingEngine');
    const { WalletService } = await import('@/lib/services/WalletService');
    const { calculateContributionFine } = await import('@/lib/fines/calculateContributionFine');

    const member = await db.member.findUnique({
        where: { id: memberId },
        select: {
            id: true,
            memberNumber: true,
            name: true,
            status: true
        }
    });

    if (!member) return null;

    // Parallelize all financial lookups
    const [
        savingsBalance,
        ledgerContributions,
        ledgerContributionBalance,
        normalContributions,
        fosaContributions,
        loansRaw,
        contributionTxCount,
        attendanceFinesRaw,
        contributionsRaw
    ] = await Promise.all([
        WalletService.getWalletBalance(memberId),
        getAccountBalance(memberId, '3011', 'CREDIT'),
        getAccountBalance(memberId, '2100', 'CREDIT'),
        getAccountBalance(memberId, '3012', 'CREDIT'),
        getAccountBalance(memberId, '2000', 'CREDIT'),
        db.loan.findMany({
            where: {
                memberId,
                status: { in: ['ACTIVE', 'OVERDUE'] }
            },
            select: {
                id: true,
                loanApplicationNumber: true,
                amount: true,
                status: true,
                disbursementDate: true,
                applicationDate: true,
                processingFee: true,
                insuranceFee: true,
                contributionDeduction: true,
                existingLoanOffset: true,
                totalDeductions: true,
                netDisbursementAmount: true,
                memberContributionsAtApplication: true,
                grossQualifyingAmount: true,
                monthlyInstallment: true,
                accruedInterestTotal: true,
                penaltyRate: true,
                interestRate: true,
                interestRatePerMonth: true,
                loanProductId: true,
                loanProduct: { select: { name: true } },
                transactions: { select: { amount: true, type: true, postedAt: true } },
                repaymentInstallments: { orderBy: { dueDate: 'asc' } },
                cachedSchedule: true,
                repaymentSchedule: true
            }
        }),
        db.ledgerTransaction.count({
            where: {
                referenceId: memberId,
                referenceType: { in: ['CONTRIBUTION_PAYMENT', 'OPENING_BALANCE'] }
            }
        }),
        db.attendanceFine.aggregate({
            _sum: { amount: true },
            where: { user: { memberId }, status: 'PENDING' }
        }),
        db.contribution.findMany({
            where: {
                memberId,
                status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
            },
            include: { product: true }
        })
    ]);

    const meetingFinesTotal = Number(attendanceFinesRaw._sum.amount || 0);

    // Calculate Contribution Fines
    const contributionFinesTotal = contributionsRaw.reduce((sum, c) => {
        const fine = calculateContributionFine({
            contributionId: c.id,
            dueDate: c.dueDate,
            scheduledAmount: c.scheduledAmount,
            amountPaid: c.amountPaid,
            status: c.status,
            flatFeeApplied: c.flatFeeApplied || c.product.flatFee,
            dailyRateApplied: c.dailyRateApplied || c.product.dailyRatePercent,
            fineEnabled: c.product.fineEnabled,
        });
        return sum + fine.totalFine;
    }, 0);

    const { processTransactions } = await import('@/lib/statementProcessor');

    // Process Loans into Detailed Table Items
    const loansList: LoanPortfolioItem[] = await Promise.all(loansRaw.map(async loan => {
        const rawTransactions = (loan.transactions || []).map((tx: any) => ({
            ...tx,
            amount: Number(tx.amount),
            createdAt: tx.postedAt,
            type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                    tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' : tx.type
        }));

        const statementRows = processTransactions(rawTransactions);
        const statementBalance = statementRows.length > 0 ? statementRows[statementRows.length - 1].runningBalance : 0;

        // Resolve Schedule
        let sched: any[] = [];
        if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
            sched = loan.repaymentInstallments;
        } else if (loan.cachedSchedule) {
            sched = loan.cachedSchedule as any[];
        } else {
            sched = await LoanScheduleCache.generateAndSaveSchedule(loan.id);
        }

        const currentUnpaidPenalty = await getLoanPenaltyBalance(loan.id);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculations
        const overdueItems = sched.filter((i: any) => new Date(i.dueDate) < today && i.status !== 'PAID');
        const overduePrincipal = overdueItems.reduce((sum, i) => sum + Number(i.principal || i.principalDue || 0), 0);
        const overdueInterest = overdueItems.reduce((sum, i) => sum + Number(i.interest || i.interestDue || 0), 0);

        const nextDueItem = sched.find((i: any) => new Date(i.dueDate) >= today && i.status !== 'PAID');
        const principalDue = (nextDueItem?.principal || 0) + overduePrincipal;
        const interestDue = (nextDueItem?.interest || 0) + overdueInterest;
        const totalDue = principalDue + interestDue;

        let daysInArrears = 0;
        if (overdueItems.length > 0) {
            const oldestDueDate = new Date(overdueItems[0].dueDate);
            daysInArrears = Math.max(0, Math.floor((now.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24)));
        }

        return {
            id: loan.id,
            loanNumber: loan.loanApplicationNumber,
            productName: loan.loanProduct?.name || 'Loan',
            approvedAmount: Number(loan.amount),
            category: overdueItems.length > 0 ? 'Substandard' : 'Performing',
            periodInArrears: overdueItems.length,
            daysInArrears,
            totalLoanBalance: statementBalance,
            principalInArrears: overduePrincipal,
            interestArrears: overdueInterest,
            penaltyCharged: currentUnpaidPenalty,
            otherCharges: 0,
            totalArrears: overduePrincipal + overdueInterest + currentUnpaidPenalty,
            principalDue,
            interestDue,
            totalDue,
            isArrears: overdueItems.length > 0,
            unpaidPenalty: currentUnpaidPenalty
        };
    }));

    // Dashboard Aggregate Totals
    const totalOutstandingBalance = loansList.reduce((sum, l) => sum + l.totalLoanBalance, 0);
    const totalBorrowed = loansRaw.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const finalPrincipalArrears = loansList.reduce((acc, l) => acc + l.principalInArrears, 0);
    const finalInterestArrears = loansList.reduce((acc, l) => acc + l.interestArrears, 0);

    const repaymentSchedulesAgg = await db.repaymentInstallment.aggregate({
        _sum: { penaltyPaid: true },
        where: { loanId: { in: loansRaw.map(l => l.id) } }
    });

    const nextMonthDueTotal = loansList.reduce((acc, l) => acc + (l.totalDue - (l.principalInArrears + l.interestArrears)), 0);
    const loanPenaltyTotal = loansList.reduce((s, l) => s + l.unpaidPenalty, 0);

    return {
        stats: {
            memberNumber: member.memberNumber.toString(),
            name: member.name.toUpperCase(),
            memberSavings: savingsBalance,
            contributionBalance: ledgerContributionBalance,
            cumulativeContributions: ledgerContributions, // Use net contributions for display
            normalContributions,
            fosaContributions,
            currentAccountBalance: savingsBalance,
            dividendAmount: 0,
            totalOutstandingBalance,
            outstandingLoans: totalOutstandingBalance,
            totalBorrowed,
            totalPenaltiesPaid: Number(repaymentSchedulesAgg._sum.penaltyPaid || 0),
            principalInArrears: finalPrincipalArrears,
            totalInterestInArrears: finalInterestArrears,
            loanOtherCharges: 0,
            loanPenalty: loanPenaltyTotal,
            totalLoanArrears: finalPrincipalArrears + finalInterestArrears + loanPenaltyTotal,
            monthlyDue: Math.max(0, nextMonthDueTotal),
            totalDue: finalPrincipalArrears + finalInterestArrears + loanPenaltyTotal + nextMonthDueTotal,
            meetingFines: meetingFinesTotal,
            contributionLatenessFines: contributionFinesTotal
        },
        loans: loansList
    };
}

/**
 * Fetch Contribution History
 */
export async function getContributionHistory(memberId: string) {
    const entries = await db.ledgerTransaction.findMany({
        where: {
            referenceId: memberId,
            referenceType: 'CONTRIBUTION_PAYMENT',
            isReversed: false
        },
        orderBy: { transactionDate: 'desc' },
        select: {
            id: true,
            transactionDate: true,
            description: true,
            totalAmount: true,
            referenceId: true,
            ledgerEntries: {
                where: { creditAmount: { gt: 0 } },
                select: { creditAmount: true }
            }
        }
    })

    return entries.map(entry => ({
        id: entry.id,
        date: entry.transactionDate,
        reference: entry.referenceId,
        description: entry.description,
        amount: Number(entry.ledgerEntries[0]?.creditAmount || entry.totalAmount)
    }));
}

/**
 * Fetch Loan Portfolio for separate display
 */
export async function getLoanPortfolio(memberId: string) {
    const data = await getDetailedMemberStats(memberId);
    return data?.loans || [];
}

/**
 * Fetch detailed Ledger Statement for a member
 */
export async function getMemberLedger(memberId: string) {
    const loans = await db.loan.findMany({ where: { memberId }, select: { id: true } });
    const loanIds = loans.map(l => l.id);

    const entries = await db.ledgerTransaction.findMany({
        where: {
            OR: [
                { referenceId: memberId },
                { referenceId: { in: loanIds } }
            ]
        },
        select: {
            id: true,
            transactionDate: true,
            postedAt: true,
            referenceId: true,
            referenceType: true,
            description: true,
            totalAmount: true,
            ledgerEntries: {
                select: {
                    ledgerAccount: { select: { code: true, name: true } },
                    debitAmount: true,
                    creditAmount: true
                }
            }
        },
        orderBy: { transactionDate: 'desc' },
        take: 100
    });

    return entries.map(entry => ({
        id: entry.id,
        date: entry.transactionDate,
        postingDate: entry.postedAt,
        reference: entry.referenceId,
        description: entry.description,
        type: entry.referenceType,
        amount: Number(entry.totalAmount),
        lines: entry.ledgerEntries.map(line => ({
            accountCode: line.ledgerAccount.code,
            accountName: line.ledgerAccount.name,
            debit: Number(line.debitAmount),
            credit: Number(line.creditAmount)
        }))
    }));
}

/**
 * Comprehensive Fetch for Member Detailed Modal
 */
export async function getMemberFullDetail(memberId: string) {
    const { calculateCurrentMonthStatus } = await import('./contribution-engine');

    const [stats, contributions, member, contributionStatus, attendanceHistory] = await Promise.all([
        getDetailedMemberStats(memberId),
        getContributionHistory(memberId),
        db.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                name: true,
                memberNumber: true,
                contact: true,
                status: true,
                contributionArrears: true,
                penaltyArrears: true,
                contactInfo: { select: { email: true, mobile: true } },
                nextOfKin: { select: { id: true, fullName: true, relationship: true, phoneNumber: true, nationality: true, altPhone: true } },
                user: { select: { id: true, image: true } }
            }
        }),
        calculateCurrentMonthStatus(memberId),
        db.meetingAttendee.findMany({
            where: { memberId },
            include: { meeting: true },
            orderBy: { meeting: { date: 'desc' } }
        })
    ]);

    if (!stats || !member) return null;

    const user = member.user;
    const unpaidPenalties = user ? await db.attendanceFine.findMany({
        where: { userId: user.id, status: 'PENDING' },
        include: { meeting: true },
        orderBy: { createdAt: 'desc' }
    }) : [];

    return serializePrisma({
        member: {
            ...member,
            memberNumber: member.memberNumber.toString(),
            email: member.contactInfo?.email,
            contact: member.contactInfo?.mobile || member.contact,
            contributionArrears: Number(member.contributionArrears || 0),
            penaltyArrears: Number(member.penaltyArrears || 0)
        },
        stats: stats.stats,
        contributions: contributions,
        contributionStatus: contributionStatus,
        loans: stats.loans,
        nextOfKin: member.nextOfKin || [],
        unpaidPenalties: (unpaidPenalties as any[]).map(p => ({
            id: p.id,
            amount: Number(p.amount),
            type: p.reason ? p.reason.split(':')[0] : 'PENALTY',
            meetingTitle: p.meeting?.title || 'Meeting',
            date: p.meeting?.date || p.createdAt,
            description: p.reason
        })),
        attendanceHistory: (attendanceHistory as any[]).map(a => ({
            id: a.id,
            meetingTitle: a.meeting?.title || 'Meeting',
            meetingDate: a.meeting?.date || new Date(),
            status: a.status,
            minutesLate: a.minutesLate
        }))
    });
}
