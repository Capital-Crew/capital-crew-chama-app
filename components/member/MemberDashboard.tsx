'use client'

import React from 'react';
import { MemberProfileView } from './MemberProfileView';

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
            <h1 className="text-2xl font-bold text-slate-900 mb-6">My Personal Dashboard</h1>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <MemberProfileView
                    member={detail.member}
                    stats={detail.stats}
                    contributions={detail.contributions}
                    contributionStatus={detail.contributionStatus}
                    loans={detail.loans}
                    nextOfKin={detail.nextOfKin}
                // showHeader={false} - MemberProfileView doesn't support this prop, but handles UI differently.
                />
            </div>
        </div>
    );
}
