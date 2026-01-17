'use client';

import { MemberLoanTableRow, LoanCategory } from '@/types/loan-table';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { ArrowUpDown } from 'lucide-react';

interface MemberAllLoansTableProps {
    loans: MemberLoanTableRow[];
}

function getCategoryBadge(category: LoanCategory) {
    switch (category) {
        case 'Performing':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Defaulted':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'Closed':
            return 'bg-gray-100 text-gray-700 border-gray-200';
        default:
            return 'bg-gray-50 text-gray-500 border-gray-100';
    }
}

export function MemberAllLoansTable({ loans }: MemberAllLoansTableProps) {
    if (!loans || loans.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
                <p className="text-gray-500 font-medium">No loan history found for this member.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <h3 className="text-sm font-bold text-gray-700">Loans Sub-Page List</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-white border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 min-w-[100px]">Loan No</th>
                            <th className="px-4 py-3 min-w-[150px]">Product Name</th>
                            <th className="px-4 py-3 text-right">Approved Amount</th>
                            <th className="px-4 py-3 text-center">Category</th>
                            <th className="px-4 py-3 text-center text-red-500">Arrears (Days)</th>
                            <th className="px-4 py-3 text-right text-teal-600">Balance</th>
                            <th className="px-4 py-3 text-right text-red-500">Prin. Arrears</th>
                            <th className="px-4 py-3 text-right text-red-500">Int. Arrears</th>
                            <th className="px-4 py-3 text-right text-teal-600">Penalty</th>
                            <th className="px-4 py-3 text-right text-teal-600">Charges</th>
                            <th className="px-4 py-3 text-right">Total Arrears</th>
                            <th className="px-4 py-3 text-right">Prin. Due</th>
                            <th className="px-4 py-3 text-right">Int. Due</th>
                            <th className="px-4 py-3 text-right text-black font-bold">Total Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loans.map((loan) => (
                            <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-4 font-medium text-teal-600">
                                    <Link href={`/loans/${loan.id}`} className="hover:underline">
                                        {loan.loanNumber}
                                    </Link>
                                </td>
                                <td className="px-4 py-4 text-gray-600">{loan.productName}</td>
                                <td className="px-4 py-4 text-gray-600 text-right">{formatCurrency(loan.approvedAmount)}</td>

                                <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadge(loan.category)}`}>
                                        {loan.category}
                                    </span>
                                </td>

                                <td className="px-4 py-4 text-center text-red-500 font-medium">
                                    {(loan.periodInArrears || 0).toFixed(2)}
                                </td>

                                <td className="px-4 py-4 text-right font-bold text-teal-600">
                                    {formatCurrency(loan.totalLoanBalance)}
                                </td>

                                <td className="px-4 py-4 text-right text-red-500 font-medium">
                                    {formatCurrency(loan.principalInArrears)}
                                </td>
                                <td className="px-4 py-4 text-right text-red-500 font-medium">
                                    {formatCurrency(loan.interestInArrears)}
                                </td>

                                <td className="px-4 py-4 text-right text-teal-600 font-medium">
                                    {formatCurrency(loan.penaltyCharged)}
                                </td>
                                <td className="px-4 py-4 text-right text-teal-600 font-medium">
                                    {formatCurrency(loan.otherCharges)}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-700 font-medium">
                                    {formatCurrency(loan.totalArrears)}
                                </td>

                                <td className="px-4 py-4 text-right text-gray-500">
                                    {formatCurrency(loan.principalDue)}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-500">
                                    {formatCurrency(loan.interestDue)}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-black border-l border-gray-100 bg-gray-50/30">
                                    {formatCurrency(loan.totalDue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
