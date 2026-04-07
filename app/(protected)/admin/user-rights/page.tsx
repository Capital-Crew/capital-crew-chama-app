import { db as prisma } from "@/lib/db"
import { UserRightsManagementModule } from "@/components/UserRightsManagementModule"
import { auth } from "@/auth"
import { protectPage } from "@/lib/with-module-protection"
import { redirect } from "next/navigation"

export default async function UserRightsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                <h1 className="text-2xl font-bold text-red-500">Authentication Required</h1>
                <p className="text-muted-foreground">Please log in to access user rights management.</p>
            </div>
        );
    }

    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    // Strict Role Check: Only SYSTEM_ADMIN and CHAIRPERSON
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const allowedRoles = ["SYSTEM_ADMIN", "CHAIRPERSON"];
    if (!user?.role || !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 max-w-md">
                    <h1 className="text-2xl font-black text-red-600 uppercase tracking-tight mb-2">Access Denied</h1>
                    <p className="text-red-800 font-medium">This module is restricted to System Administrators and the Chairperson only.</p>
                </div>
            </div>
        );
    }

    const [expenseAccounts, users, modules, permissions] = await Promise.all([
        prisma.ledgerAccount.findMany({
            where: {
                OR: [
                    { type: 'REVENUE' },
                    { type: 'ASSET' }
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
        }),
        prisma.systemModule.findMany({ orderBy: { key: 'asc' } }),
        prisma.rolePermission.findMany()
    ])

    // Serialize Decimal accounts
    const serializedExpenseAccounts = expenseAccounts.map((a: any) => ({
        ...a,
        balance: Number(a.balance || 0),
        openingBalance: Number(a.openingBalance || 0)
    }));

    return (
        <div className="p-8">
            <UserRightsManagementModule
                users={users}
                modules={modules}
                permissions={permissions}
                expenseAccounts={serializedExpenseAccounts}
            />
        </div>
    )
}
