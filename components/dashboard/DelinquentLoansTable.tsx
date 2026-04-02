import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, User } from 'lucide-react'

interface DelinquentLoan {
    loanId: string
    loanNumber: string
    memberName: string
    memberId: string
    arrears: number
    daysOverdue: number
}

interface Props {
    loans: DelinquentLoan[]
}

export function DelinquentLoansTable({ loans }: Props) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-red-50/30">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Delinquent Loans</h3>
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Action Required</p>
                    </div>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase">
                    {loans.length} High Risk
                </span>
            </div>

            <div className="divide-y divide-slate-50">
                {loans.map((loan) => (
                    <div key={loan.loanId} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <Link href={`/members/${loan.memberId}`} className="text-xs font-black text-slate-900 hover:text-red-600 transition-colors">
                                        {loan.memberName}
                                    </Link>
                                    <p className="text-[10px] text-slate-500 font-medium">{loan.loanNumber}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-red-600">KES {loan.arrears.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">In Arrears</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                    loan.daysOverdue > 30 ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {loan.daysOverdue} Days Overdue
                                </span>
                            </div>
                            <Link 
                                href={`/loans/${loan.loanId}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                            >
                                Details <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                ))}

                {loans.length === 0 && (
                    <div className="p-10 text-center text-slate-400 italic text-sm">
                        No delinquent loans found. Great job!
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-50/50 text-center border-t border-slate-50">
                <Link href="/loans?status=OVERDUE" className="text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest">
                    View All Overdue Loans
                </Link>
            </div>
        </div>
    )
}
