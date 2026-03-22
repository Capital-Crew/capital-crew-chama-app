import Link from 'next/link'
import { MemberStats } from '@/app/actions/member-dashboard-actions'

interface MemberFactBoxProps {
    stats: MemberStats
    isNavigable?: boolean
    className?: string
}

export default function MemberFactBox({ stats, isNavigable = false, className = '' }: MemberFactBoxProps) {
    const { member, financials } = stats

    // Format currency
    const fmt = (val: number) => new Intl.NumberFormat('en-KE', {
        style: 'decimal',
        minimumFractionDigits: 2
    }).format(val)

    const CardContent = (
        <div className={`bg-white shadow-sm border border-gray-200 rounded-lg p-4 w-full border-l-4 border-l-teal-500 ${className}`}>
            <h2 className="text-gray-800 font-bold mb-4">Member Statistics FactBox</h2>

            {}
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Member Details</h3>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">No.</span>
                        <span className="font-medium text-gray-900">{member.memberNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Name</span>
                        <span className="font-medium text-gray-900 text-right" title={member.name}>{member.name}</span>
                    </div>
                    {member.email && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-gray-900 truncate w-32 text-right" title={member.email}>{member.email}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mobile</span>
                        <span className="font-medium text-gray-900">{member.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Account Category</span>
                        <span className="font-medium text-gray-900">{member.category}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-bold ${member.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {member.status}
                        </span>
                    </div>

                </div>
            </div>

            {}
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Financial Statistics</h3>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center group">
                        <span className="text-gray-500">Contributions</span>
                        <span className="font-semibold text-teal-600 group-hover:underline cursor-pointer">
                            {fmt(financials.shareCapital)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Current Account</span>
                        <span className="font-semibold text-teal-600">
                            {fmt(financials.savingsBalance)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-teal-50 px-2 py-1 -mx-2 rounded pointer-events-none">
                        <span className="text-teal-800 font-medium">Outstanding Loans</span>
                        <span className="font-bold text-teal-700">
                            {fmt(financials.loanBalance)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Contributions Due</span>
                        <span className="font-medium text-gray-900">
                            {fmt(financials.sharesDue)}
                        </span>
                    </div>
                </div>
            </div>

            {isNavigable && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <span className="text-xs text-teal-600 font-medium hover:underline">View Full Profile &rarr;</span>
                </div>
            )}
        </div>
    )

    if (isNavigable) {
        return (
            <Link href={`/members/${member.id}`} className="block hover:ring-2 ring-teal-500 rounded-lg transition-all focus:outline-none">
                {CardContent}
            </Link>
        )
    }

    return CardContent
}
