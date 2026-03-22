import { format } from 'date-fns'

interface Contribution {
    id: string
    date: Date
    reference: string
    description: string
    amount: number
}

export default function ContributionsTab({ contributions }: { contributions: Contribution[] }) {

    const sortedAsc = [...contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let total = 0
    const withRunningTotal = sortedAsc.map(c => {
        total += c.amount
        return { ...c, runningTotal: total }
    })
    const displayData = withRunningTotal.reverse()

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 px-1">Contribution Timeline</h3>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 uppercase tracking-wider bg-slate-100/50">Running Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                    No contributions recorded yet.
                                </td>
                            </tr>
                        ) : (
                            displayData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                        {format(new Date(row.date), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{row.description}</span>
                                            <span className="text-xs text-slate-400 font-mono">{row.reference}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-teal-600">
                                        +{new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2 }).format(row.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900 bg-slate-50/50 group-hover:bg-slate-100/50">
                                        {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2 }).format(row.runningTotal)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
