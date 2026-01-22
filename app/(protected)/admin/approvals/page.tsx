
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getPendingApprovals } from '@/app/actions/approval-actions'
import { ApprovalsDashboard } from '@/components/approvals/ApprovalsDashboard'

export default async function ApprovalsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const requests = await getPendingApprovals()

    return (
        <div className="p-4 md:p-8 w-full space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Approvals Inbox</h1>
                <p className="text-slate-500 font-medium">pending requests requiring your decision</p>
            </div>

            <ApprovalsDashboard requests={requests} currentUserId={session.user.id!} />
        </div>
    )
}
