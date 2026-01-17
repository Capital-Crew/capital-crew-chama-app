
import React from 'react';
import { MemberStats } from './types';

interface Props {
    stats: MemberStats;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const MemberStatsGrid: React.FC<Props> = ({ stats }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 text-sm">

                {/* Column 1 */}
                <div className="space-y-2">
                    <div className="grid grid-cols-[120px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Member No:</span>
                        <span className="text-slate-900 font-bold">{stats.memberNumber}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Name:</span>
                        <span className="text-slate-900 font-bold uppercase">{stats.memberName}</span>
                    </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-2">
                    <div className="grid grid-cols-[180px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">C Member Savings:</span>
                        <span className="text-slate-900 font-bold text-right md:text-left">
                            {formatCurrency(stats.savingsBalance)}
                        </span>
                    </div>
                    <div className="grid grid-cols-[180px_1fr] items-baseline">
                        <span className="text-slate-500 font-medium">Total Outstanding Balance:</span>
                        <span className="text-slate-900 font-bold text-right md:text-left">
                            {formatCurrency(stats.totalOutstandingBalance)}
                        </span>
                    </div>
                </div>

                {/* Column 3 (Empty or Extra Stats) */}
                <div className="space-y-2">
                    {/* Placeholder for future expansion or "Arrears" if implemented */}
                </div>
            </div>
        </div>
    );
};
