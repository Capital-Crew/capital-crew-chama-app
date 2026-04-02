import React from 'react'
import Link from 'next/link'
import { Coins, User, ArrowRight } from 'lucide-react'

interface ContributionArrears {
    memberId: string
    memberName: string
    arrears: number
    lastMissed: string // ISO date or formatted date
}

interface Props {
    arrears: ContributionArrears[]
}

export function ContributionArrearsTable({ arrears }: Props) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-amber-50/30">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <Coins className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Contribution Gaps</h3>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Savings Arrears</p>
                    </div>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">
                    {arrears.length} Members
                </span>
            </div>

            <div className="divide-y divide-slate-50">
                {arrears.map((item) => (
                    <div key={item.memberId} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                    {item.memberName.charAt(0)}
                                </div>
                                <div>
                                    <Link href={`/members/${item.memberId}`} className="text-xs font-black text-slate-900 hover:text-amber-600 transition-colors">
                                        {item.memberName}
                                    </Link>
                                    <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                                        Last gap in {new Date(item.lastMissed).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-amber-600">KES {item.arrears.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total Arrears</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Link 
                                href={`/members/${item.memberId}?tab=wallet`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                            >
                                View Wallet <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                ))}

                {arrears.length === 0 && (
                    <div className="p-10 text-center text-slate-400 italic text-sm">
                        All members are up to date! 🚀
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-50/50 text-center border-t border-slate-50">
                <Link href="/accounting/contributions" className="text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest">
                    Manage Contributions
                </Link>
            </div>
        </div>
    )
}
