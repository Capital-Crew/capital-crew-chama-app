
import { notFound } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { getMemberContributionBalance, getMemberWalletBalance, getLoanFinancials } from '@/lib/accounting/AccountingEngine'
import { MemberStatsGrid } from '@/components/member/legacy-dashboard/MemberStatsGrid'
import { ActiveLoansTable } from '@/components/member/legacy-dashboard/ActiveLoansTable'
import { MemberStats, ActiveLoanRow } from '@/components/member/legacy-dashboard/types'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MemberLegacyProfilePage({ params }: PageProps) {
    const { id } = await params

    // 1. Fetch Member & Core Data
    const member = await prisma.member.findUnique({
        where: { id },
        include: {
            loans: {
                where: {
                    status: { in: ['ACTIVE', 'OVERDUE'] }
                },
                include: {
                    loanProduct: true
                }
            }
        }
    })

    if (!member) {
        return notFound()
    }

    // 2. Calculate Financials using Accounting Engine
    const savingsBalance = await getMemberWalletBalance(member.id); // "Member Savings" (Deposit/Wallet)
    // Note: If "C Member Savings" means "Contributions/Shares", switch to getMemberContributionBalance(member.id)

    // 3. Process Loans
    let totalOutstandingBalance = 0;
    const activeLoans: ActiveLoanRow[] = [];

    for (const loan of member.loans) {
        // Fetch breakdown from Ledger
        const financials = await getLoanFinancials(loan.id);

        totalOutstandingBalance += financials.total;

        // Fetch current unpaid installment from RepaymentSchedule
        const currentInstallment = await prisma.repaymentInstallment.findFirst({
            where: {
                loanId: loan.id,
                isFullyPaid: false
            },
            orderBy: {
                dueDate: 'asc'
            }
        });

        // Calculate monthly due from schedule (principalDue + interestDue)
        const monthlyDue = currentInstallment
            ? Number(currentInstallment.principalDue) + Number(currentInstallment.interestDue)
            : 0;

        activeLoans.push({
            id: loan.id,
            loanNumber: loan.loanApplicationNumber,
            productName: loan.loanProduct?.name || 'N/A',
            approvedAmount: loan.amount ? Number(loan.amount.toString()) : 0,

            // Map to interface
            expectedAmount: monthlyDue ?? 0,
            arrears: 0, // Defaulting to 0 as we only fetched current installment
            nextExpectedDate: currentInstallment?.dueDate ? new Date(currentInstallment.dueDate).toISOString() : null,
            isOverdue: currentInstallment?.dueDate ? new Date(currentInstallment.dueDate) < new Date() : false,

            // "Total Loan Balance" from ledger
            totalLoanBalance: financials.total
        });
    }

    const stats: MemberStats = {
        memberId: member.id,
        memberName: member.name,
        memberNumber: member.memberNumber.toString(), // or padStart handled in UI
        savingsBalance,
        totalOutstandingBalance
    };

    return (
        <div className="w-full px-4 md:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    {member.memberNumber} · {member.name.toUpperCase()}
                </h1>
                <p className="text-slate-500 text-sm mt-1">Legacy Dashboard View</p>
            </div>

            {/* Section A: General Stats */}
            <section>
                <h2 className="text-lg font-semibold text-slate-700 mb-3 border-l-4 border-sky-600 pl-3">
                    General Statistics
                </h2>
                <MemberStatsGrid stats={stats} />
            </section>

            {/* Section B: Loans List */}
            <section>
                <h2 className="text-lg font-semibold text-slate-700 mb-3 border-l-4 border-sky-600 pl-3">
                    Active Loans
                </h2>
                <ActiveLoansTable loans={activeLoans} />
            </section>
        </div>
    )
}
