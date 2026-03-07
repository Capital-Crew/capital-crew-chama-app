'use client'

import React from 'react';
import { MemberProfileView } from './MemberProfileView';
import { MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link'

interface MemberDashboardProps {
    detail: any;
}

export function MemberDashboard({ detail }: MemberDashboardProps) {
    if (!detail) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 font-bold italic">No member profile linked to this account.</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Dashboard</h1>
                    <p className="text-sm text-slate-500 font-medium">Real-time overview of your SACCO activity</p>
                </div>

                <Link
                    href="/meetings/apology"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <MessageSquare className="w-4 h-4" />
                    SUBMIT MEETING APOLOGY
                </Link>
            </div>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <MemberProfileView
                    member={detail.member}
                    stats={detail.stats}
                    contributions={detail.contributions}
                    contributionStatus={detail.contributionStatus}
                    loans={detail.loans}
                    nextOfKin={detail.nextOfKin}
                    unpaidPenalties={detail.unpaidPenalties}
                    attendanceHistory={detail.attendanceHistory}
                    currentUserId={detail.member.id}
                    currentUserRole="MEMBER"
                />
            </div>
        </div>
    );
}
