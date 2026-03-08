import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { protectPage } from "@/lib/with-module-protection"
import { MeetingReportForm } from "@/components/meetings/MeetingReportForm"
import { getSaccoSettings } from "@/app/sacco-settings-actions"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function NewMeetingReportPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }
    if (!await protectPage('MEETINGS')) return redirect('/dashboard');

    // Role Check removed: Everyone can access as per user request

    // 1. Fetch COMPLETED meetings that haven't been processed yet
    const meetings = await prisma.meeting.findMany({
        where: {
            status: 'COMPLETED',
            isPenaltiesProcessed: false,
            date: { lte: new Date() }
        },
        orderBy: { date: 'desc' }
    });

    // 2. Fetch Active Members with their User IDs (needed for processing)
    const rawMembers = await prisma.member.findMany({
        where: { status: { in: ['ACTIVE', 'APPROVED'] } },
        include: {
            user: {
                select: { id: true }
            }
        },
        orderBy: { memberNumber: 'asc' }
    });

    // 3. Fetch Apologies for available meetings to pre-inform the form
    // Note: The form will dynamically show apologies once a meeting is selected if we want to be fancy,
    // but for now we'll fetch all apologies for pending meetings.
    const apologies = await prisma.apology.findMany({
        where: { meetingId: { in: meetings.map(m => m.id) } }
    });

    const members = rawMembers.map(m => ({
        id: m.id,
        name: m.name,
        memberNumber: m.memberNumber,
        userId: m.user?.id || null,
        apologyStatus: apologies.find(a => a.userId === m.user?.id)?.status || null
    }));

    // 4. Fetch Sacco Settings
    const settings = await getSaccoSettings();

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Post Meeting Report</h1>
                                <p className="text-sm text-slate-500 font-medium">Capture attendance and process penalties</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Meeting Mode</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <MeetingReportForm
                    meetings={meetings}
                    members={members}
                    settings={{
                        penaltyAbsentAmount: Number(settings.penaltyAbsentAmount),
                        penaltyLateAmount: Number(settings.penaltyLateAmount)
                    }}
                />
            </main>
        </div>
    );
}
