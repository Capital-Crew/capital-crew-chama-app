
import React from 'react';
import { ActiveLoanRow } from './types';
import { formatCurrency } from '@/lib/decimal-utils';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

import { format } from 'date-fns';

interface Props {
    loans: (ActiveLoanRow & { status?: string })[];
    onLoanClick: (id: string) => void;
}

export const ActiveLoansTable: React.FC<Props> = ({ loans, onLoanClick }) => {
    // Filter loans
    const activeLoans = loans.filter(l =>
        ['ACTIVE', 'OVERDUE', 'WRITTEN_OFF', 'DISBURSED'].includes(l.status || 'ACTIVE')
    );
    const clearedLoans = loans.filter(l => l.status === 'CLEARED');

    const LoanRow = ({ loan, isHistory = false }: { loan: ActiveLoanRow & { status?: string }, isHistory?: boolean }) => (
        <tr
            key={loan.id}
            className={`transition-colors ${isHistory ? 'hover:bg-slate-50' : 'bg-white hover:bg-sky-50'}`}
        >
            <td className="py-4 px-6 font-medium text-slate-900">
                <button
                    onClick={() => onLoanClick(loan.id)}
                    className={`font-bold text-left flex items-center gap-2 ${isHistory ? 'text-slate-600 hover:text-slate-900' : 'text-blue-600 hover:text-blue-800'}`}
                >
                    {isHistory ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-blue-500" />}
                    {loan.loanNumber}
                </button>
            </td>
            <td className="py-4 px-6 text-slate-700">
                <span className="block font-semibold">{loan.productName}</span>
                {loan.status === 'OVERDUE' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                        Overdue
                    </span>
                )}
            </td>
            <td className="py-4 px-6 text-right text-slate-700">
                {formatCurrency(loan.approvedAmount)}
            </td>
            <td className={`py-4 px-6 text-right font-medium ${loan.totalLoanBalance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                {formatCurrency(loan.totalLoanBalance)}
            </td>

            {/* Arrears - Highlight Red if > 0 */}
            <td className={`py-4 px-6 text-right font-medium ${loan.arrears > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                {loan.arrears > 0 ? formatCurrency(loan.arrears) : '-'}
            </td>

            {/* Expected Payment */}
            <td className="py-4 px-6 text-right text-slate-900 font-bold">
                {loan.expectedAmount > 0 ? formatCurrency(loan.expectedAmount) : '-'}
            </td>
            <td className="py-4 px-6 text-right text-slate-500">
                {loan.nextExpectedDate
                    ? format(new Date(loan.nextExpectedDate), 'dd-MMM-yyyy')
                    : '-'}
            </td>
        </tr>
    );

    return (
        <div className="space-y-8">
            {/* Active Portfolio Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Active Portfolio</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Current Obligations</p>
                    </div>
                </div>

                <div className="bg-white border boundary-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-6 whitespace-nowrap">Loan No</th>
                                    <th className="py-3 px-6 whitespace-nowrap">Product</th>
                                    <th className="py-3 px-6 text-right whitespace-nowrap">Approved</th>
                                    <th className="py-3 px-6 text-right whitespace-nowrap">Balance</th>
                                    <th className="py-3 px-6 text-right whitespace-nowrap text-red-600">Arrears</th>
                                    <th className="py-3 px-6 text-right whitespace-nowrap">Expected Payment</th>
                                    <th className="py-3 px-6 text-right whitespace-nowrap">Expected Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeLoans.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                                            No active loans.
                                        </td>
                                    </tr>
                                ) : (
                                    activeLoans.map(loan => <LoanRow key={loan.id} loan={loan} />)
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Cleared History Section */}
            {clearedLoans.length > 0 && (
                <div className="opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 mb-4 mt-8">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-700">Cleared History</h3>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fully Repaid Loans</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-6 whitespace-nowrap">Loan No</th>
                                        <th className="py-3 px-6 whitespace-nowrap">Product</th>
                                        <th className="py-3 px-6 text-right whitespace-nowrap">Original Amount</th>
                                        <th className="py-3 px-6 text-right whitespace-nowrap">Final Balance</th>
                                        <th className="py-3 px-6 text-right whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/50">
                                    {clearedLoans.map(loan => <LoanRow key={loan.id} loan={loan} isHistory={true} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
