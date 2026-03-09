'use client';

import { LoanPortfolioItem } from '@/types/member-dashboard';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { getRiskBucket, getRiskBucketColor } from '@/lib/reporting-utils';

interface LoansSubTableProps {
    loans: LoanPortfolioItem[];
}

export function LoansSubTable({ loans }: LoansSubTableProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <h3 className="text-sm font-bold text-gray-700">Loans Sub-Page List</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/50 text-gray-400 font-medium uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 font-medium">Loan No &uarr;</th>
                            <th className="px-4 py-3 font-medium">Loan Product Name</th>
                            <th className="px-4 py-3 font-medium text-right">Approved Amount</th>
                            <th className="px-4 py-3 font-medium">Loans Category</th>
                            <th className="px-4 py-3 font-medium">Class</th>
                            <th className="px-4 py-3 font-medium text-right text-red-400">Period In Arrears</th>
                            <th className="px-4 py-3 font-medium text-right text-cyan-600">Total loan balance</th>
                            <th className="px-4 py-3 font-medium text-right">Principal in arrears</th>
                            <th className="px-4 py-3 font-medium text-right">Interest in arrears</th>
                            <th className="px-4 py-3 font-medium text-right">Penalty Charged</th>
                            <th className="px-4 py-3 font-medium text-right">Loan other charges</th>
                            <th className="px-4 py-3 font-medium text-right">Total arrears</th>
                            <th className="px-4 py-3 font-medium text-right">Principal due</th>
                            <th className="px-4 py-3 font-medium text-right">Interest due</th>
                            <th className="px-4 py-3 font-medium text-right font-bold text-gray-700">Total due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600">
                        {loans.map((loan, idx) => (
                            <tr key={loan.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-cyan-50/30 transition-colors`}>
                                <td className="px-4 py-3">
                                    <Link href={`/loans/${loan.id}`} className="text-teal-600 hover:text-teal-800 hover:underline underline-offset-2 font-medium">
                                        {loan.loanNumber}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-800">{loan.productName}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(loan.approvedAmount)}</td>
                                <td className="px-4 py-3">{loan.category}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRiskBucketColor(getRiskBucket(loan.daysInArrears))}`}>
                                        {getRiskBucket(loan.daysInArrears)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-red-500 font-medium">{loan.periodInArrears.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-teal-600 font-medium">
                                    <Link href={`/loans/${loan.id}`} className="hover:underline underline-offset-2">
                                        {formatCurrency(loan.totalLoanBalance)}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-right text-red-500">{formatCurrency(loan.principalInArrears)}</td>
                                <td className="px-4 py-3 text-right text-red-500">{formatCurrency(0)}</td> {/* Interest Arrears breakdown not in basic item yet, strictly 0 per screenshot mostly, or mapped */}
                                <td className="px-4 py-3 text-right text-teal-500">{formatCurrency(0)}</td>
                                <td className="px-4 py-3 text-right text-teal-500">{formatCurrency(0)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(loan.principalInArrears)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(loan.principalDue)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(loan.interestDue)}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(loan.totalDue)}</td>
                            </tr>
                        ))}
                        {loans.length === 0 && (
                            <tr>
                                <td colSpan={14} className="text-center py-8 text-gray-400 italic">No active loans found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
