'use server'

import { db } from '@/lib/db'
import { calculateLoanSchedule } from '@/lib/services/loanCalculator'; // Keep for type fallback if needed but LoanScheduleCache replaces it
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { MemberStats as DetailedMemberStats, LoanPortfolioItem } from '@/types/member-dashboard';
import { serializePrisma } from '@/lib/serialization';
import { LoanScheduleCache } from '@/lib/services/LoanScheduleCache';
import { calculateCurrentMonthStatus } from './contribution-engine';

// --- Types ---

export type MemberStats = {
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
        shareCapital: number
        savingsBalance: number
        loanBalance: number
        totalBorrowed: number
        totalPenaltiesPaid: number
        sharesDue: number
    }
}

// --- Helpers ---

// Helper to aggregate account balance for a member
async function getAccountBalance(memberId: string, accountCode: string, normalSide: 'DEBIT' | 'CREDIT') {
    const result = await db.ledgerEntry.aggregate({
        _sum: {
            debitAmount: true,
            creditAmount: true
        },
        where: {
            ledgerAccount: { code: accountCode },
            ledgerTransaction: {
                referenceId: memberId, // Linked to Member primarily
                isReversed: false
            }
        }
    })

    // Convert BigInt Cents to Main Units
    const debits = Number(result._sum.debitAmount || 0n) / 100
    const credits = Number(result._sum.creditAmount || 0n) / 100

    return normalSide === 'DEBIT' ? debits - credits : credits - debits
}

// --- Server Actions ---

/**
 * Fetch detailed stats for the Member FactBox
 * Aggregates real-time financial data from the General Ledger.
 */
export async function getMemberStats(memberId: string): Promise<MemberStats | null> {
    try {
        const member = await db.member.findUnique({
            where: { id: memberId },
            include: {
                branch: true,
                contactInfo: true,
                nextOfKin: true
            }
        })

        if (!member) return null

        // Import WalletService dynamically or statically
        const { WalletService } = await import('@/lib/services/WalletService')

        const shareCapital = await getAccountBalance(memberId, '2100', 'CREDIT')
        const savingsBalance = await WalletService.getWalletBalance(memberId)

        // Loan Balance (Account 1200) - Debit Normal (Asset)
        const loans = await db.loan.findMany({
            where: { memberId: memberId },
            select: { id: true }
        })
        const loanIds = loans.map(l => l.id)

        let loanBalance = 0
        if (loanIds.length > 0) {
            const loanResult = await db.ledgerEntry.aggregate({
                _sum: {
                    debitAmount: true,
                    creditAmount: true
                },
                where: {
                    ledgerAccount: { code: '1200' }, // Portfolio
                    ledgerTransaction: {
                        referenceId: { in: loanIds },
                        isReversed: false
                    }
                }
            })
            // Convert BigInt Cents
            const debits = Number(loanResult._sum.debitAmount || 0n) / 100
            const credits = Number(loanResult._sum.creditAmount || 0n) / 100
            loanBalance = debits - credits
        }

        return {
            member: {
                id: member.id,
                memberNumber: member.memberNumber,
                name: member.name,
                mobile: member.contactInfo?.mobile || member.contact,
                status: member.status,
                branchName: member.branch?.name || 'Main',
                category: 'Individual',
                email: member.contactInfo?.email || undefined,
                beneficiaries: (member as any).nextOfKin?.map((k: any) => ({
                    ...k,
                    allocation: Number(k.allocation)
                })) || (member as any).beneficiaries || []
            },
            financials: {
                shareCapital,
                savingsBalance,
                loanBalance,
                sharesDue: 0,
                totalBorrowed: 0,
                totalPenaltiesPaid: 0
            }
        }
    } catch (error) {
        console.error("Error fetching member stats:", error)
        return null
    }
}

/**
 * Fetch Exact Member Stats for the Pixel-Perfect Dashboard
 */
export async function getDetailedMemberStats(memberId: string): Promise<{ stats: DetailedMemberStats, loans: LoanPortfolioItem[] } | null> {
    const member = await db.member.findUnique({
        where: { id: memberId },
        include: {
            branch: true,
            wallet: true // Fetch wallet for Current Account Balance
        }
    });

    if (!member) return null;

    // 1. Fetch Balances via Accounting Engine
    const { WalletService } = await import('@/lib/services/WalletService')

    // Parallelize all independent fetches
    const [
        savingsBalance,
        contributionsBalance,
        shareCapital,
        normalShares,
        fosaShares,
        loansRaw
    ] = await Promise.all([
        WalletService.getWalletBalance(memberId), // Savings (Account 2200)
        getAccountBalance(memberId, '1200', 'CREDIT'), // Contributions (Account 1200)
        getAccountBalance(memberId, '2100', 'CREDIT'), // Share Capital
        getAccountBalance(memberId, '2200', 'CREDIT'), // Normal Shares
        getAccountBalance(memberId, '2000', 'CREDIT'), // FOSA Shares
        db.loan.findMany({
            where: {
                memberId,
                status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
            },
            include: {
                loanProduct: true,
                transactions: true,
                repaymentInstallments: {
                    orderBy: { dueDate: 'asc' }
                }
            }
        })
    ]);

    // Import statement processor for consistent balance calculation
    const { processTransactions } = await import('@/lib/statementProcessor');

    // Serialize basic fields & Calculate Balances using STATEMENT Logic (Same as Table)
    const loans = loansRaw.map(loanItem => {
        const loan = loanItem as any;

        // Map LoanTransaction to structure expected by processTransactions
        const rawTransactions = loan.transactions ? loan.transactions.map((tx: any) => ({
            ...tx,
            amount: Number(tx.amount),
            createdAt: tx.postedAt,
            type: tx.type
        })) : [];

        const mappedTransactions = rawTransactions.map((tx: any) => ({
            ...tx,
            type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                    tx.type
        }));

        const statementRows = processTransactions(mappedTransactions as any[]);
        const statementBalance = statementRows.length > 0
            ? statementRows[statementRows.length - 1].runningBalance
            : 0;

        return {
            ...loan,
            loanProduct: loan.loanProduct,
            outstandingBalance: statementBalance, // Use Calculated Balance
            amount: Number(loan.amount),
            processingFee: Number(loan.processingFee),
            insuranceFee: Number(loan.insuranceFee),
            shareCapitalDeduction: Number(loan.shareCapitalDeduction),
            existingLoanOffset: Number(loan.existingLoanOffset),
            totalDeductions: Number(loan.totalDeductions),
            netDisbursementAmount: Number(loan.netDisbursementAmount),
            memberSharesAtApplication: Number(loan.memberSharesAtApplication),
            grossQualifyingAmount: Number(loan.grossQualifyingAmount),
            monthlyInstallment: loan.monthlyInstallment ? Number(loan.monthlyInstallment) : 0,
            accruedInterestTotal: loan.accruedInterestTotal ? Number(loan.accruedInterestTotal) : 0,
            penaltyRate: loan.penaltyRate ? Number(loan.penaltyRate) : 0,
            interestRate: Number(loan.interestRate),
            interestRatePerMonth: loan.interestRatePerMonth ? Number(loan.interestRatePerMonth) : 0,
        };
    });

    let totalOutstandingBalance = 0;
    let totalBorrowed = 0;
    let totalPenaltiesPaid = 0;
    const loanOtherCharges = 0;

    // Detailed Loan List Calculation
    const loansList: LoanPortfolioItem[] = await Promise.all(loans.map(async loan => {
        let principalDue = 0;
        let interestDue = 0;

        // Use Statement Balance
        const realTimeBalance = loan.outstandingBalance;

        // Parse Schedule with Cache Strategy
        let schedule: any[] = [];
        if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
            schedule = loan.repaymentInstallments;
        } else if (loan.cachedSchedule) {
            // CACHE HIT (O(1))
            schedule = loan.cachedSchedule as any[];
        } else if (loan.repaymentSchedule && (loan.repaymentSchedule as any[]).length > 0) {
            schedule = loan.repaymentSchedule as any[];
        } else {
            // CACHE MISS - Generate, Save, and Use
            console.log(`[Cache] Generating schedule for loan ${loan.id}`)
            schedule = await LoanScheduleCache.generateAndSaveSchedule(loan.id)
        }
        const now = new Date();

        // Let's use the schedule to find overdue items
        const overdueItems = schedule.filter((i: any) => new Date(i.dueDate) < now && i.status !== 'PAID');
        const overduePrincipal = overdueItems.reduce((sum: number, i: any) => sum + i.principal, 0);
        const overdueInterest = overdueItems.reduce((sum: number, i: any) => sum + i.interest, 0);

        // Next Due
        const nextDueItem = schedule.find((i: any) => new Date(i.dueDate) >= now && i.status !== 'PAID');
        const currentDuePrincipal = nextDueItem?.principal || 0;
        const currentDueInterest = nextDueItem?.interest || 0;

        // Totals for this loan items
        principalDue = currentDuePrincipal + overduePrincipal;
        interestDue = currentDueInterest + overdueInterest;
        const totalDue = principalDue + interestDue;

        const isArrears = overdueItems.length > 0;

        return {
            id: loan.id,
            loanNumber: loan.loanApplicationNumber,
            productName: loan.loanProduct.name,
            approvedAmount: loan.amount,
            category: isArrears ? 'Substandard' : 'Performing',
            periodInArrears: overdueItems.length,
            totalLoanBalance: realTimeBalance, // Updated to use Ledger Balance
            principalInArrears: overduePrincipal,
            // New Fields
            interestArrears: overdueInterest,
            penaltyCharged: loan.penalties ? Number(loan.penalties) : 0,
            otherCharges: 0,
            totalArrears: overduePrincipal + overdueInterest + (Number(loan.penalties) || 0),

            principalDue: principalDue,
            interestDue: interestDue,
            totalDue: totalDue,
            isArrears: isArrears
        };
    }));

    // Aggregates - Summing real-time balances
    totalOutstandingBalance = loansList.reduce((sum, l) => sum + l.totalLoanBalance, 0);
    totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0); // already converted
    const finalPrincipalArrears = loansList.reduce((acc, l) => acc + l.principalInArrears, 0);

    // Interest Arrears calculation
    const finalInterestArrears = loansList.reduce((acc, l) => {
        const sched = (loans.find(x => x.id === l.id)?.repaymentSchedule as any[]) || [];
        const od = sched.filter((i: any) => new Date(i.dueDate) < new Date() && i.status !== 'PAID');
        return acc + od.reduce((s: number, x: any) => s + x.interest, 0);
    }, 0);

    // Penalties Paid calculation (from RepaymentInstallment records)
    const repaymentSchedules = await db.repaymentInstallment.aggregate({
        _sum: {
            penaltyPaid: true
        },
        where: {
            loanId: { in: loans.map(l => l.id) }
        }
    });
    totalPenaltiesPaid = Number(repaymentSchedules._sum.penaltyPaid || 0);

    const nextMonthDue = loansList.reduce((acc, l) => {
        const sched = (loans.find(x => x.id === l.id)?.repaymentSchedule as any[]) || [];
        const next = sched.find((i: any) => new Date(i.dueDate) >= new Date() && i.status !== 'PAID');
        return acc + (next?.total || 0);
    }, 0);

    const loanPenalty = loans.reduce((s, l) => s + Number(l.penalties || 0), 0);
    const totalArrears = finalPrincipalArrears + finalInterestArrears + loanPenalty;
    const totalDue = totalArrears + nextMonthDue;

    return {
        stats: {
            memberNumber: member.memberNumber.toString(),
            name: member.name.toUpperCase(),

            // Core Financials (Real-time)
            memberSavings: savingsBalance,     // Replaces manual aggregation
            contributions: contributionsBalance, // New Field

            shareCapital: shareCapital,
            normalShares: normalShares,
            fosaShares: fosaShares,
            currentAccountBalance: savingsBalance, // Use the proper balance

            dividendAmount: 0,
            totalOutstandingBalance,
            outstandingLoans: totalOutstandingBalance, // Fix for MemberQuickStats reading this specific key
            totalBorrowed,
            totalPenaltiesPaid,
            principalInArrears: finalPrincipalArrears,
            totalInterestInArrears: finalInterestArrears,
            loanOtherCharges,
            loanPenalty: loanPenalty,
            totalLoanArrears: totalArrears,
            monthlyDue: nextMonthDue,
            totalDue: totalDue
        },
        loans: loansList
    };
}

/**
 * Fetch Contribution History
 * Returns linear list of contribution transactions
 */
export async function getContributionHistory(memberId: string) {
    const entries = await db.ledgerTransaction.findMany({
        where: {
            referenceId: memberId,
            referenceType: 'SHARE_CONTRIBUTION',
            isReversed: false
        },
        orderBy: { transactionDate: 'desc' },
        include: {
            ledgerEntries: {
                where: {
                    creditAmount: { gt: 0 }
                }
            }
        }
    })

    return entries.map(entry => {
        const creditLine = entry.ledgerEntries.find(l => Number(l.creditAmount) > 0)
        return {
            id: entry.id,
            date: entry.transactionDate,
            reference: entry.referenceId, // Ref ID or generated ID? entryNumber removed.
            description: entry.description,
            amount: (Number(creditLine?.creditAmount || entry.totalAmount) / 100) // Convert Cents
        }
    })
}

/**
 * Fetch Loan Portfolio
 */
export async function getLoanPortfolio(memberId: string) {
    const loans = await db.loan.findMany({
        where: {
            memberId,
            status: {
                in: ['ACTIVE', 'OVERDUE', 'CLEARED', 'DISBURSED'] // Only disbursed/past loans
            }
        },
        include: {
            loanProduct: true,
            transactions: true, // Fetch LoanTransaction (Source of Truth for Statement)
            repaymentInstallments: {
                orderBy: { dueDate: 'asc' }
            }
        },
        orderBy: { applicationDate: 'desc' }
    })

    // Import statement processor for consistent balance calculation
    const { processTransactions } = await import('@/lib/statementProcessor');

    // Serialize loans to convert Decimal to number for Client Component
    const detailedLoans = await Promise.all(loans.map(async loanItem => {
        const loan = loanItem as any; // Cast to bypass inference limits on Includes

        // Map LoanTransaction to structure expected by processTransactions
        // Effectively replicating getLoanStatement logic
        const rawTransactions = loan.transactions ? loan.transactions.map((tx: any) => {
            return {
                ...tx,
                amount: Number(tx.amount),
                createdAt: tx.postedAt, // LoanTransaction uses postedAt
                type: tx.type
            };
        }) : [];

        // processTransactions expects types: DISBURSEMENT, REPAYMENT, CHARGE, PENALTY, INTEREST
        // Ensure mapping aligns if LoanTransaction types differ 
        const mappedTransactions = rawTransactions.map((tx: any) => ({
            ...tx,
            type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                    tx.type
        }));

        const statementRows = processTransactions(mappedTransactions as any[]);
        const statementBalance = statementRows.length > 0
            ? statementRows[statementRows.length - 1].runningBalance
            : 0;

        // Use Cache for Waterfall logic
        let waterfallSchedule: any[] = [];
        if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
            waterfallSchedule = loan.repaymentInstallments;
        } else if (loan.cachedSchedule) {
            waterfallSchedule = loan.cachedSchedule as any[];
        } else if (loan.repaymentSchedule && (loan.repaymentSchedule as any[]).length > 0) {
            waterfallSchedule = loan.repaymentSchedule as any[];
        } else {
            // Generate if missing
            waterfallSchedule = await LoanScheduleCache.generateAndSaveSchedule(loan.id)
        }

        return {
            ...loan,
            outstandingBalance: loan.outstandingBalance ? Number(loan.outstandingBalance) : 0,
            amount: Number(loan.amount),
            processingFee: Number(loan.processingFee),
            insuranceFee: Number(loan.insuranceFee),
            shareCapitalDeduction: Number(loan.shareCapitalDeduction),
            existingLoanOffset: Number(loan.existingLoanOffset),
            totalDeductions: Number(loan.totalDeductions),
            netDisbursementAmount: Number(loan.netDisbursementAmount),
            memberSharesAtApplication: Number(loan.memberSharesAtApplication),
            grossQualifyingAmount: Number(loan.grossQualifyingAmount),
            monthlyInstallment: loan.monthlyInstallment ? Number(loan.monthlyInstallment) : 0,
            accruedInterestTotal: loan.accruedInterestTotal ? Number(loan.accruedInterestTotal) : 0,
            penaltyRate: loan.penaltyRate ? Number(loan.penaltyRate) : 0,
            interestRate: Number(loan.interestRate),
            interestRatePerMonth: loan.interestRatePerMonth ? Number(loan.interestRatePerMonth) : 0,

            // Dashboard Fields
            id: loan.id,
            loanNumber: loan.loanApplicationNumber,
            productName: loan.loanProduct?.name || 'Unknown',
            balance: statementBalance, // Use Statement Balance
            status: loan.status,
            date: loan.disbursementDate || loan.applicationDate,

            // Legacy Fields
            approvedAmount: Number(loan.amount),
            // Waterfall Repayment Logic
            ...(() => {
                const sched = waterfallSchedule; // Use our resolved schedule

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of day

                // 1. Calculate Arrears (Past Due)
                // Filter: date < Today AND !isFullyPaid
                const overdueItems = sched.filter((i: any) => {
                    const d = new Date(i.dueDate || i.date);
                    // Strict inequality for past due. Today's installment is "Current Due", not "Arrears".
                    return d < today && !i.isFullyPaid;
                });

                const pastPrincipal = overdueItems.reduce((sum: number, i: any) => sum + Number(i.principalDue || i.principal || 0), 0);
                const pastInterest = overdueItems.reduce((sum: number, i: any) => sum + Number(i.interestDue || i.interest || 0), 0);
                // Prompt: "TotalPenalties = loan.penaltyDue". 
                // Using loan.penalties from DB or summing from Schedule if needed. 
                // Assuming loan.penalties is the source of truth for "Accumulated Penalties".
                const totalPenalties = Number(loan.penalties || 0);

                const arrears = pastPrincipal + pastInterest + totalPenalties;

                // 2. Calculate Current Due
                // Find first installment where date >= Today
                const currentInstallment = sched.find((i: any) => {
                    const d = new Date(i.dueDate || i.date);
                    return d >= today;
                });

                let currentDue = 0;
                let expectedDateVal = currentInstallment ? (currentInstallment.dueDate || currentInstallment.date) : null;

                if (currentInstallment) {
                    // Theoretical Principal (Sum of all FUTURE including current)
                    const futureItems = sched.filter((i: any) => new Date(i.dueDate || i.date) >= today);
                    const theoreticalPrincipal = futureItems.reduce((sum: number, i: any) => sum + Number(i.principalDue || i.principal || 0), 0);

                    // Overpayment = TheoreticalPrincipal - ActualBalance
                    // Note: ActualBalance (statementBalance) includes Interest/Penalties.
                    // If StatementBalance < TheoreticalPrincipal, user has paid ahead on Principal.
                    // If StatementBalance < TheoreticalPrincipal, user has paid ahead on Principal.
                    const op = Math.max(0, theoreticalPrincipal - statementBalance);

                    // Adjusted Principal
                    const adjustedPrincipal = Math.max(0, Number(currentInstallment.principalDue || currentInstallment.principal || 0) - op);

                    currentDue = Number(currentInstallment.interestDue || currentInstallment.interest || 0) + adjustedPrincipal;
                }

                // 3. Expected Amount
                let totalExpected = arrears + currentDue;
                // Cap at Balance
                totalExpected = Math.min(totalExpected, statementBalance);

                // 4. Expected Date
                if (arrears > 0 && overdueItems.length > 0) {
                    expectedDateVal = overdueItems[0].dueDate || overdueItems[0].date;
                }

                return {
                    arrears: arrears,
                    expectedAmount: totalExpected,
                    nextExpectedDate: expectedDateVal,
                    isOverdue: arrears > 0
                };
            })(),

            principalDue: 0,
            interestDue: 0,
            totalDue: statementBalance,
            totalLoanBalance: statementBalance
        };
    }));

    return detailedLoans;
}

/**
 * Fetch detailed Ledger Statement for a member
 * Used for the Account Statements Tab
 */
export async function getMemberLedger(memberId: string) {
    const loans = await db.loan.findMany({ where: { memberId }, select: { id: true } })
    const loanIds = loans.map(l => l.id)

    const entries = await db.ledgerTransaction.findMany({
        where: {
            OR: [
                { referenceId: memberId },
                { referenceId: { in: loanIds } }
            ],
            isReversed: false
        },
        include: {
            ledgerEntries: {
                include: {
                    ledgerAccount: true
                }
            }
        },
        orderBy: { transactionDate: 'desc' },
        take: 100
    })

    return entries.map(entry => {
        return {
            id: entry.id,
            date: entry.transactionDate,
            postingDate: entry.postedAt,
            reference: entry.referenceId, // entryNumber removed
            description: entry.description,
            type: entry.referenceType,
            amount: Number(entry.totalAmount) / 100, // Aggregate Cents
            lines: entry.ledgerEntries.map(line => ({
                accountCode: line.ledgerAccount.code,
                accountName: line.ledgerAccount.name,
                debit: Number(line.debitAmount) / 100,
                credit: Number(line.creditAmount) / 100
            }))
        }
    })
}

export async function refreshMemberStats(memberId: string) {
    revalidatePath(`/members/${memberId}`);
}

/**
 * Comprehensive Fetch for Member Detailed Modal
 */
export async function getMemberFullDetail(memberId: string) {
    // Parallelize all major dashboard fetches
    const [stats, contributions, portfolio, member, contributionStatus] = await Promise.all([
        getDetailedMemberStats(memberId),
        getContributionHistory(memberId),
        getLoanPortfolio(memberId),
        db.member.findUnique({
            where: { id: memberId },
            include: {
                contactInfo: true,
                nextOfKin: true
            }
        }),
        calculateCurrentMonthStatus(memberId)
    ]);

    if (!stats || !member) return null;

    console.log(`[getMemberFullDetail] Member ${memberId} has ${member?.nextOfKin?.length || 0} Next of Kin records`);

    return serializePrisma({
        member: {
            id: member.id,
            name: member.name,
            memberNumber: member.memberNumber.toString(),
            email: member.contactInfo?.email,
            contact: member.contactInfo?.mobile || member.contact,
            contributionArrears: Number(member.contributionArrears || 0),
            penaltyArrears: Number(member.penaltyArrears || 0)
        },
        stats: stats.stats,
        contributions: contributions,
        contributionStatus: contributionStatus,
        loans: portfolio,
        nextOfKin: member?.nextOfKin || []
    });
}
