import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ApologyForm } from "@/components/meetings/ApologyForm"
import { ChevronLeft, Info } from "lucide-react"
import Link from "next/link"

export default async function MemberApologyPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    // 1. Fetch upcoming meetings where deadline hasn't passed (Today + 3 Days)
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3);

    const meetings = await prisma.meeting.findMany({
        where: {
            date: { gte: deadlineDate },
            status: 'SCHEDULED'
        },
        orderBy: { date: 'asc' }
    });

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meeting Apology</h1>
                            <p className="text-sm text-slate-500 font-medium">Notify the SACCO of your absence</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-12">
                {meetings.length > 0 ? (
                    <ApologyForm meetings={meetings} />
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center space-y-4">
                        <div className="inline-flex p-4 bg-slate-50 rounded-full mb-2">
                            <Info className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Eligible Meetings</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium">
                            There are no upcoming meetings for which apologies are still active. (Reminders: Must be submitted at least 3 days in advance).
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                )}

                <div className="mt-8 bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-lg font-black mb-2">Why submit an apology?</h4>
                        <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                            Approved apologies exempt you from the standard "Absentee Fine". Ensure you submit your reason clearly and before the 3-day deadline.
                        </p>
                    </div>
                    {/* Decorative Blob */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                </div>
            </main>
        </div>
    );
}
