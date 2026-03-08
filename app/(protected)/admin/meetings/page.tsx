import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { protectPage } from "@/lib/with-module-protection"
import { MeetingsAdminPanel } from "@/components/meetings/MeetingsAdminPanel"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function AdminMeetingsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")
    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    const allowedRoles = ["SYSTEM_ADMIN", "SECRETARY", "CHAIRPERSON"]
    if (!user?.role || !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-12">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-slate-500">You do not have permission to manage meetings.</p>
            </div>
        )
    }

    const meetings = await prisma.meeting.findMany({
        orderBy: { date: "desc" },
        include: {
            _count: {
                select: { attendees: true, apologies: true, fines: true }
            }
        }
    })

    // Serialize dates for client components
    const serializedMeetings = meetings.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        status: m.status,
        isPenaltiesProcessed: m.isPenaltiesProcessed,
        _count: m._count
    }))

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Meeting Management</h1>
                        <p className="text-xs text-slate-500 font-medium">Schedule and manage SACCO meetings</p>
                    </div>
                </div>
            </div>
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                <MeetingsAdminPanel meetings={serializedMeetings as any} />
            </main>
        </div>
    )
}
