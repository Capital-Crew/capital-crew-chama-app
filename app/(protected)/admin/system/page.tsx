import prisma from "@/lib/prisma"
import { SystemAdminModule } from "@/components/SystemAdminModule"
import { auth } from "@/auth"
import { getWelfareTypes } from '@/app/welfare-types-actions'
import { getWelfareRequisitions } from '@/app/welfare-requisition-actions'

export default async function SystemAdminPage() {
    const session = await auth();
    // Strict Role Check
    const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { role: true }
    });

    const allowedRoles = ["CHAIRPERSON", "SYSTEM_ADMIN", "TREASURER", "SECRETARY"];
    if (!user?.role || !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view system administration.</p>
            </div>
        );
    }

    const [products, members, welfareTypesRes, welfareReqsRes, expenseAccounts, users] = await Promise.all([
        prisma.loanProduct.findMany({
            // Fetch ALL products so we can toggle active state, not just active ones
            orderBy: { name: 'asc' }
        }),
        prisma.member.findMany({
            select: {
                id: true,
                name: true,
                memberNumber: true,
                canApproveLoan: true
            },
            orderBy: { memberNumber: 'asc' }
        }),
        getWelfareTypes(true),
        getWelfareRequisitions('ALL'),
        prisma.ledgerAccount.findMany({
            where: {
                OR: [
                    { type: 'EXPENSE' },
                    { code: { startsWith: '4' } }
                ]
            },
            orderBy: { code: 'asc' }
        }),
        prisma.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                permissions: true,
                member: {
                    select: {
                        memberNumber: true,
                        canApproveLoan: true,
                        wallet: {
                            select: { id: true, accountRef: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' },
            where: { email: { not: 'admin@capitalcrew.co.ke' } }
        })
    ])

    const welfareTypes = welfareTypesRes.success ? welfareTypesRes.data : []
    const requisitions = welfareReqsRes.success ? welfareReqsRes.data : []

    const serializedProducts = products.map((p: any) => ({
        ...p,
        principal: p.principal ? Number(p.principal) : 0,
        minPrincipal: p.minPrincipal ? Number(p.minPrincipal) : 0,
        maxPrincipal: p.maxPrincipal ? Number(p.maxPrincipal) : 0,
        interestRatePerPeriod: p.interestRatePerPeriod ? Number(p.interestRatePerPeriod) : 0,
        defaultPenaltyRate: p.defaultPenaltyRate ? Number(p.defaultPenaltyRate) : 0,
        createdAt: p.createdAt?.toISOString(),
        updatedAt: p.updatedAt?.toISOString()
    }));

    // Serialize Welfare Types
    const serializedWelfareTypes = welfareTypes.map((w: any) => ({
        ...w,
        monthlyContribution: w.monthlyContribution ? Number(w.monthlyContribution) : 0,
        minLoanLimit: w.minLoanLimit ? Number(w.minLoanLimit) : 0,
        maxLoanLimit: w.maxLoanLimit ? Number(w.maxLoanLimit) : 0,
        currentBalance: w.currentBalance ? Number(w.currentBalance) : 0,
        // Add other decimal fields if any
    }));

    // Serialize Welfare Requisitions
    const serializedRequisitions = requisitions.map((r: any) => ({
        ...r,
        amount: Number(r.amount),
        approvedAmount: r.approvedAmount ? Number(r.approvedAmount) : null
    }));

    // Serialize Expense Accounts
    const serializedExpenseAccounts = expenseAccounts.map((a: any) => ({
        ...a,
        balance: Number(a.balance || 0),
        openingBalance: Number(a.openingBalance || 0)
    }));

    return (
        <div className="p-8">
            <SystemAdminModule
                products={serializedProducts as any}
                members={members}
                welfareTypes={serializedWelfareTypes}
                welfareRequisitions={serializedRequisitions}
                expenseAccounts={serializedExpenseAccounts}
                users={users}
            />
        </div>
    )
}
