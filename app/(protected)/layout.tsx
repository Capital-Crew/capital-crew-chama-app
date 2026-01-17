
import { auth } from "@/auth"
import { AppSidebar } from "@/components/AppSidebar"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/SiteHeader"

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
    const { getApprovalCounts } = await import('@/app/actions/approval-actions');
    const approvalCount = await getApprovalCounts();

    return (
        <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
            <AppSidebar user={session.user as any} approvalCount={approvalCount} />
            <main className="flex-1 ml-80 w-full px-4 md:px-8 py-8">
                <SiteHeader user={session.user as any} />
                {children}
            </main>
        </div>
    )
}
