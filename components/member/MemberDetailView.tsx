'use client'

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { NextOfKinManager } from './NextOfKinManager';
import { MemberQuickStats } from './MemberQuickStats';

import type { MemberStats } from '@/types/member-dashboard';
import { LoanAppraisalCard } from '@/components/LoanAppraisalCard';

interface MemberDetailViewProps {
    member: {
        id: string;
        name: string;
        memberNumber: string;
        email?: string;
        contact?: string;
    };
    stats: any;
    contributions: any[];
    loans: any[];
    nextOfKin: any[];
    showHeader?: boolean;
    currentUserId?: string;
}

export function MemberDetailView({
    member,
    stats,
    contributions,
    loans,
    nextOfKin,
    showHeader = true,
    ...props
}: MemberDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'contributions' | 'loans' | 'kin'>('loans');
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

    // Debug: Log nextOfKin data
    console.log('[MemberDetailView] nextOfKin data:', nextOfKin);

    // Adapt props for MemberQuickStats
    const quickStatsData = {
        identity: {
            firstName: member.name.split(' ')[0],
            lastName: member.name.split(' ').slice(1).join(' ') || '',
            fullName: member.name,
            memberNumber: Number(member.memberNumber)
        },
        financials: stats
    };

    return (
        <div className="bg-white rounded-[2rem] w-full flex flex-col">
            <div className="px-8 mt-8 mb-8">
                <MemberQuickStats stats={quickStatsData} />
            </div>

            {/* Tabs */}
            <div className="px-8 border-b border-slate-100 flex gap-8">
                <TabButton
                    isActive={activeTab === 'loans'}
                    onClick={() => setActiveTab('loans')}
                    label="Loan History"
                />
                <TabButton
                    isActive={activeTab === 'contributions'}
                    onClick={() => setActiveTab('contributions')}
                    label="Contributions History"
                />
                <TabButton
                    isActive={activeTab === 'kin'}
                    onClick={() => setActiveTab('kin')}
                    label="Next of Kin"
                />
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-8 pt-4">
                {activeTab === 'contributions' && (
                    <ContributionsTable contributions={contributions} />
                )}
                {activeTab === 'loans' && (
                    <ActiveLoansTable
                        loans={loans}
                        onLoanClick={(id) => setSelectedLoanId(id)}
                    />
                )}
                {activeTab === 'kin' && (
                    <NextOfKinManager initialData={nextOfKin} memberId={member.id} />
                )}
            </div>

            {/* Loan Card Modal */}
            <LoanAppraisalCard
                loanId={selectedLoanId || ''}
                isOpen={!!selectedLoanId}
                onClose={() => setSelectedLoanId(null)}
                currentUserId={props.currentUserId!}
                activeTab="appraisal"
            />
        </div>
    );
}

function TabButton({ isActive, onClick, label }: { isActive: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`pb-4 text-sm font-black transition-all border-b-2 ${isActive
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
        >
            {label}
        </button>
    );
}

function ContributionsTable({ contributions }: { contributions: any[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4 rounded-l-xl">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right rounded-r-xl">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {contributions.map((c, i) => (
                        <tr key={i} className="text-sm font-bold text-slate-600">
                            <td className="px-6 py-4">{new Date(c.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{c.description}</td>
                            <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(c.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// function LoansTable removed as it is replaced by ActiveLoansTable
import { ActiveLoansTable } from '@/components/member/legacy-dashboard/ActiveLoansTable';
