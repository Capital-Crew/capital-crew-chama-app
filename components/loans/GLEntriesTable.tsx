
import React from 'react';
import { GLEntry } from '@/lib/types/loan-transaction';
import { formatCurrency } from '@/lib/utils';

interface GLEntriesTableProps {
    entries: GLEntry[];
}

export function GLEntriesTable({ entries }: GLEntriesTableProps) {
    // Calculate totals for footer
    const totalDebit = entries.reduce((sum, e) => sum + e.debitAmount, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.creditAmount, 0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800">General Ledger Entries</h3>
                <p className="text-xs text-slate-500">Double-entry record of this transaction</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-6 whitespace-nowrap font-mono text-xs uppercase tracking-wider">Account No.</th>
                            <th className="py-3 px-6">Account Name</th>
                            <th className="py-3 px-6 text-right w-32">Debit</th>
                            <th className="py-3 px-6 text-right w-32">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-6 font-mono text-xs text-slate-500">
                                    {entry.glAccountNo}
                                </td>
                                <td className="py-3 px-6 font-medium text-slate-700">
                                    {entry.glAccountName}
                                </td>
                                <td className="py-3 px-6 text-right font-mono text-slate-600">
                                    {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                                </td>
                                <td className="py-3 px-6 text-right font-mono text-slate-600">
                                    {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                        <tr>
                            <td colSpan={2} className="py-3 px-6 text-right uppercase text-xs tracking-wider">Totals</td>
                            <td className="py-3 px-6 text-right border-t-2 border-slate-300">
                                {formatCurrency(totalDebit)}
                            </td>
                            <td className="py-3 px-6 text-right border-t-2 border-slate-300">
                                {formatCurrency(totalCredit)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
