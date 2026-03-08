import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { protectPage } from "@/lib/with-module-protection"
import { MeetingsHub } from "@/components/meetings/MeetingsHub"

export default async function MeetingsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")
    if (!await protectPage('MEETINGS')) return redirect('/dashboard')

    // Fetch upcoming SCHEDULED meetings (future dates)
    const upcomingMeetings = await prisma.meeting.findMany({
        where: {
            status: "SCHEDULED",
            date: { gte: new Date() }
        },
        orderBy: { date: "asc" }
    })

    // Fetch current user's unpaid attendance fines
    const pendingFines = await prisma.attendanceFine.findMany({
        where: {
            userId: session.user.id,
            status: "PENDING"
        },
        include: {
            meeting: { select: { title: true, date: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    const serializedMeetings = upcomingMeetings.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        status: m.status
    }))

    const serializedFines = pendingFines.map(f => ({
        id: f.id,
        amount: Number(f.amount),
        reason: f.reason,
        meeting: f.meeting ? { title: f.meeting.title, date: f.meeting.date } : null,
        createdAt: f.createdAt
    }))

    return (
        <div className="min-h-screen bg-slate-50/50">
            <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                <MeetingsHub
                    upcomingMeetings={serializedMeetings}
                    pendingFines={serializedFines}
                />
            </main>
        </div>
    )
}
