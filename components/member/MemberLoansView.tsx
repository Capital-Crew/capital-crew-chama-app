'use client';

import { MemberLoanTableRow } from '@/types/loan-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LoanStatusBadge } from '@/components/LoanStatusBadge';

interface MemberLoansViewProps {
    loans: MemberLoanTableRow[];
}

export default function MemberLoansView({ loans }: MemberLoansViewProps) {
    // Sort by date descending (newest first)
    // using date from mapper (disbursement or application date)
    const sortedLoans = [...loans].sort((a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {}
            <div className="flex border-b border-gray-200">
                <div className="px-6 py-4 border-b-2 border-cyan-500 text-cyan-500 font-bold text-sm uppercase tracking-wide">
                    My Loans
                    <span className="ml-2 bg-cyan-100 text-cyan-700 py-0.5 px-2 rounded-full text-xs">
                        {loans.length}
                    </span>
                </div>
            </div>

            <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                    <tr>
                        <th className="px-6 py-4">App #</th>
                        <th className="px-6 py-4">Member</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                    {sortedLoans.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                                No loans found.
                            </td>
                        </tr>
                    ) : (
                        sortedLoans.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-cyan-500">
                                        {l.loanNumber}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-900">
                                    {l.memberName || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-cyan-500">
                                    {formatCurrency(l.approvedAmount)}
                                </td>
                                <td className="px-6 py-4">
                                    <LoanStatusBadge status={l.status as any} size="sm" />
                                </td>
                                <td className="px-6 py-4 text-right italic text-slate-400">
                                    {formatDate(l.date || new Date())}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
