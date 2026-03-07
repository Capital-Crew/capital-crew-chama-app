import { getDashboardStats, getMonthlyTrends } from '@/app/dashboard-actions'
import { DashboardView } from '@/components/DashboardView'
import { auth } from '@/auth'
import { getMemberFullDetail } from '@/app/actions/member-dashboard-actions'
import { MemberDashboard } from '@/components/member/MemberDashboard'
import { redirect } from 'next/navigation'

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Never cache, always fetch fresh data

export default async function DashboardPage() {
    const session = await auth()

    // Guard: if session expired or missing, send back to login
    if (!session) {
        redirect('/login')
    }

    const memberId = session?.user?.memberId;

    // Fetch Global Stats — session is guaranteed valid at this point
    const stats = await getDashboardStats()
    const trends = await getMonthlyTrends()

    // If user is a regular member, we might want to also pass their personal details 
    // so the view can offer a toggle. For now, per request "dashboard should be accessible to everyone",
    // we render the Global DashboardView. 
    // Ideally, we pass 'personalDashboard' as a prop or render it in a tab.

    let personalDetail = null;
    if (memberId) {
        personalDetail = await getMemberFullDetail(memberId);
    }

    return <DashboardView stats={stats} trends={trends} personalDetail={personalDetail} />
}
