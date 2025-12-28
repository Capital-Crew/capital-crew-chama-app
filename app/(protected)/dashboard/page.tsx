
import prisma from "@/lib/prisma"
import { DashboardView } from "@/components/DashboardView"
import { LoanStatus } from "@/lib/types"

export default async function DashboardPage() {
    // Parallel data fetching
    const [
        membersCount,
        activeLoansCount,
        auditLogsCount,
        incomes,
        expenses
    ] = await Promise.all([
        prisma.member.count(),
        prisma.loan.count({ where: { status: LoanStatus.ACTIVE } }),
        prisma.auditLog.count(),
        prisma.income.findMany(),
        prisma.expense.findMany(),
    ])

    const totalAssets = incomes.reduce((sum, i) => sum + i.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)

    return (
        <DashboardView
            membersCount={membersCount}
            activeLoansCount={activeLoansCount}
            auditLogsCount={auditLogsCount}
            totalAssets={totalAssets}
            incomes={incomes as any}
            expenses={expenses as any}
        />
    )
}
