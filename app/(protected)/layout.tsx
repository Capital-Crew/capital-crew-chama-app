
import { auth } from "@/auth"
import { AppSidebar } from "@/components/AppSidebar"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/SiteHeader"

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

    // Fetch Approval Count
    // const approvalCount = await getApprovalCounts(); // Existing logic (likely expensive if not optimized)

    // Parallel Fetching for performance
    const [approvalCount, pendingLoanCountResult] = await Promise.all([
        getApprovalCounts(),
        import('@/app/actions/loan-actions').then(mod => mod.getPendingLoanCount())
    ]);

    // Ensure we handle the potential 0 or error returns safely
    const pendingLoanCount = typeof pendingLoanCountResult === 'number' ? pendingLoanCountResult : 0;

    return (
        <div className="min-h-screen bg-slate-50 lemon:bg-yellow-50 flex text-slate-800 lemon:text-yellow-900 font-sans">
            <AppSidebar user={session.user as any} approvalCount={approvalCount} pendingLoanCount={pendingLoanCount} />

            <main className="flex-1 w-full md:ml-80 px-4 md:px-8 py-8 transition-all duration-300 overflow-x-hidden">
                <SiteHeader user={session.user as any} approvalCount={approvalCount} />
                {children}
            </main>
        </div>
    )
}
