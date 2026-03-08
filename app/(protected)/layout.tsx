
import { auth } from "@/auth"
import { AppSidebar } from "@/components/AppSidebar"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/SiteHeader"
import { InactivityHandler } from "@/components/providers/InactivityHandler"
import { RBACProvider } from "@/components/providers/RBACProvider"

import { getApprovalCounts } from '@/lib/data/approval-data';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    // Check for password change requirement
    const { checkPasswordStatus } = await import('@/app/actions/check-password-status');
    const { mustChange } = await checkPasswordStatus();

    if (mustChange) {
        redirect("/auth/force-change-password");
    }

    // Fetch live user role from DB to prevent stale JWT bypassing
    const { db } = await import('@/lib/db');
    const liveUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const currentRole = liveUser?.role || (session.user as any).role;

    // Parallel Fetching for performance
    const [approvalCount, pendingLoanCountResult, permissionsList] = await Promise.all([
        getApprovalCounts(),
        import('@/app/actions/loan-actions').then(mod => mod.getPendingLoanCount()),
        import('@/lib/rbac-service').then(mod => mod.getPermissionsForRole(currentRole))
    ]);

    // Ensure we handle the potential 0 or error returns safely
    const pendingLoanCount = typeof pendingLoanCountResult === 'number' ? pendingLoanCountResult : 0;

    // Transform permissions to map for provider
    const permissionsMap = permissionsList.reduce((acc: Record<string, boolean>, p: { key: string, canAccess: boolean }) => {
        acc[p.key] = p.canAccess;
        return acc;
    }, {} as Record<string, boolean>);

    return (
        <InactivityHandler>
            <RBACProvider initialPermissions={permissionsMap}>
                <div className="min-h-screen bg-slate-50 lemon:bg-yellow-50 flex text-slate-800 lemon:text-yellow-900 font-sans">
                    <AppSidebar user={session.user as any} approvalCount={approvalCount} pendingLoanCount={pendingLoanCount} />

                    <main className="flex-1 w-full md:ml-80 px-4 md:px-8 py-8 transition-all duration-300 overflow-x-hidden">
                        <SiteHeader user={session.user as any} approvalCount={approvalCount} />
                        {children}
                    </main>
                </div>
            </RBACProvider>
        </InactivityHandler>
    )
}
