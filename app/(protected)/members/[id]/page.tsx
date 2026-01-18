import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { getMemberFullDetail } from "@/app/actions/member-dashboard-actions"
import { MemberDetailView } from "@/components/member/MemberDetailView"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MemberProfilePage({ params }: PageProps) {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
        // Should be protected by middleware but safe check
        return notFound()
    }

    const detail = await getMemberFullDetail(id)

    if (!detail) {
        return notFound()
    }

    return (
        <div className="w-full px-4 md:px-8 py-8">
            <h1 className="text-2xl font-black text-slate-900 mb-6 uppercase italic italic tracking-tighter">Member Profile</h1>

            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                <MemberDetailView
                    member={detail.member as any}
                    stats={detail.stats}
                    contributions={detail.contributions}
                    loans={detail.loans}
                    nextOfKin={detail.nextOfKin}
                    currentUserId={session.user.id}
                />
            </div>
        </div>
    )
}
