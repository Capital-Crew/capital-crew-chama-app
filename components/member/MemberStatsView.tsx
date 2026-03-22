'use client';

import { MemberStats, LoanPortfolioItem } from '@/types/member-dashboard';
import { MemberAllLoansTable } from './tables/MemberAllLoansTable';
import { RefreshButton } from './RefreshButton';
import { formatCurrency } from '@/lib/utils';
import { Pencil, Copy, Plus, Trash2 } from 'lucide-react';
import { MemberQuickStats } from './MemberQuickStats';

interface MemberStatsViewProps {
    stats: MemberStats;
    loans: LoanPortfolioItem[];
    memberId: string;
    snapshot?: any;
}

const StatRow = ({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-dotted border-gray-200 last:border-0">
        <span className="text-xs uppercase text-gray-500 tracking-wider font-medium">{label}</span>
        <span className={`text-sm font-medium text-right ${highlight ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
            {typeof value === 'number' ? formatCurrency(value) : value}
        </span>
    </div>
);

export function MemberStatsView({ stats, loans, memberId, snapshot }: MemberStatsViewProps) {
    return (
        <div className="bg-white min-h-screen font-sans">
            {}


            {}
            {snapshot ? (
                <MemberQuickStats stats={snapshot} />
            ) : (
                <div className="mb-8">
                    <h2 className="text-3xl font-light text-gray-600 mb-1">
                        <span className="font-normal text-gray-800">{stats.memberNumber}</span> · {stats.name}
                    </h2>
                    <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide border-b border-gray-200 pb-2 w-fit">Reports</div>
                </div>
            )}

            {}
            <div className="mb-8">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">General Information</h3>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                        {}
                        <div className="space-y-4">
                            <StatRow label="Member No." value={stats.memberNumber} />
                            <StatRow label="Member Name" value={stats.name} />
                            <StatRow label="Total Contributions" value={stats.shareCapital} />
                        </div>

                        {}
                        <div className="space-y-4">
                            <StatRow label="Current Account Balance" value={stats.currentAccountBalance} />
                            <StatRow label="Total Outstanding Loan Balance" value={stats.totalOutstandingBalance} highlight />
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="mb-8">
                <MemberAllLoansTable loans={loans as any} />
            </div>
        </div>
    );
}
