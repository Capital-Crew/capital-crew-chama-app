import { format } from 'date-fns'

interface LedgerEntry {
    id: string
    date: Date
    reference: string
    description: string
    amount: number
    lines: { accountCode: string, accountName: string, debit: number, credit: number }[]
}

export default function StatementsTab({ ledger }: { ledger: LedgerEntry[] }) {
    return (
        <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Range</label>
                    <div className="flex items-center space-x-2">
                        <input type="date" className="bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                        <span className="text-slate-400">-</span>
                        <input type="date" className="bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account</label>
                    <select className="bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none min-w-[200px]">
                        <option>All Accounts</option>
                        <option>Savings (2000)</option>
                        <option>Shares (2100)</option>
                        <option>Loans (1200)</option>
                    </select>
                </div>
                <button className="bg-teal-600 text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-teal-700 transition-colors ml-auto">
                    Generate Statement
                </button>
            </div>

            {/* Statement Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gray-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Ref</th>
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-right">Debit</th>
                            <th className="px-6 py-3 text-right">Credit</th>
                            {/* <th className="px-6 py-3 text-right">Balance</th> */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 font-mono text-xs">
                        {ledger.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">No ledger entries found.</td>
                            </tr>
                        ) : (
                            ledger.map((entry) => {
                                // For display, we usually show the aggregated Debit and Credit for clarity?
                                // Or we just show one line per entry.
                                // Let's show the Totals.
                                const debit = entry.lines.reduce((sum, l) => sum + l.debit, 0)
                                const credit = entry.lines.reduce((sum, l) => sum + l.credit, 0)

                                return (
                                    <tr key={entry.id} className="hover:bg-yellow-50/50 transition-colors even:bg-slate-50">
                                        <td className="px-6 py-3 text-slate-600">
                                            {format(new Date(entry.date), 'yyyy-MM-dd')}
                                        </td>
                                        <td className="px-6 py-3 text-slate-500">
                                            {entry.reference}
                                        </td>
                                        <td className="px-6 py-3 text-slate-900 font-semibold break-words max-w-md">
                                            {entry.description}
                                        </td>
                                        <td className={`px-6 py-3 text-right font-medium ${debit > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {debit > 0 ? new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2 }).format(debit) : '-'}
                                        </td>
                                        <td className={`px-6 py-3 text-right font-medium ${credit > 0 ? 'text-teal-600' : 'text-slate-300'}`}>
                                            {credit > 0 ? new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2 }).format(credit) : '-'}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
                * This is a system generated statement. Errors and Omissions Excepted (E&OE).
            </p>
        </div>
    )
}
