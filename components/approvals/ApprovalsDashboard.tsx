'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApprovalRequest } from '@prisma/client'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { LoanAppraisalCard } from '@/components/LoanAppraisalCard'
import { MemberDetailsCard } from './MemberDetailsCard'
import { UserCheck, FileText, DollarSign, Users, ChevronRight } from 'lucide-react'

// Icon mapping
const TYPE_ICONS = {
    'LOAN': DollarSign,
    'MEMBER': Users,
    'EXPENSE': FileText,
    'WELFARE': Users,
    'OTHER': FileText
}

const TYPE_COLORS = {
    'LOAN': 'from-blue-400 to-blue-600',
    'MEMBER': 'from-purple-400 to-purple-600',
    'EXPENSE': 'from-emerald-400 to-emerald-600',
    'WELFARE': 'from-pink-400 to-pink-600',
    'OTHER': 'from-slate-400 to-slate-600'
}

interface ApprovalsDashboardProps {
    requests: ApprovalRequest[]
    currentUserId: string
}

export function ApprovalsDashboard({ requests, currentUserId }: ApprovalsDashboardProps) {
    const router = useRouter()
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
    const [filter, setFilter] = useState('ALL')

    const visibleRequests = filter === 'ALL'
        ? requests
        : requests.filter(r => r.type === filter)

    const handleClose = () => {
        setSelectedRequest(null)
        router.refresh()
    }

    return (
        <div className="space-y-8 font-sans">
            {/* Header / Filter */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {['ALL', 'LOAN', 'MEMBER', 'EXPENSE'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`
                            px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm whitespace-nowrap
                            ${filter === f
                                ? 'bg-gradient-to-r from-[#00c2e0] to-[#019ab3] text-white shadow-[#00c2e0]/30 shadow-lg scale-105'
                                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:shadow-md'
                            }
                        `}
                    >
                        {f === 'ALL' ? 'All Requests' : f + 's'}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleRequests.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <UserCheck className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
                        <p className="text-slate-500 text-sm mt-2">No pending approvals in this category.</p>
                    </div>
                ) : (
                    visibleRequests.map(req => {
                        const Icon = TYPE_ICONS[req.type as keyof typeof TYPE_ICONS] || FileText
                        const gradient = TYPE_COLORS[req.type as keyof typeof TYPE_COLORS] || 'from-slate-400 to-slate-600'

                        return (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className="group relative bg-white/70 backdrop-blur-xl border border-white/20 hover:border-[#00c2e0]/30 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl shadow-sm rounded-3xl p-6 overflow-hidden"
                            >
                                {/* Decorative Gradient Blur */}
                                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 blur-3xl transition-opacity duration-500 rounded-full pointer-events-none`} />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${gradient} text-white group-hover:scale-110 transition-transform duration-500`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
                                                {req.type}
                                            </p>
                                            <h3 className="font-bold text-slate-800 leading-tight line-clamp-1 text-lg mt-0.5 group-hover:text-[#00c2e0] transition-colors">
                                                {req.requesterName || 'Unknown Request'}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Status Dot */}
                                    <div className={`w-3 h-3 rounded-full shadow-inner ${req.status === 'PENDING' ? 'bg-amber-400 shadow-amber-400/50 animate-pulse' : 'bg-slate-300'}`} />
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[40px] leading-relaxed">
                                        {req.description || `Request for ${req.referenceTable}`}
                                    </p>

                                    {req.amount && (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                                            <span className="text-2xl font-black text-slate-800 tracking-tight ml-auto">
                                                <span className="text-xs text-slate-400 font-bold mr-1 align-top relative top-1">KES</span>
                                                {Number(req.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center relative z-10">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {format(new Date(req.createdAt), 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#00c2e0] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        Review <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* DYNAMIC MODALS */}
            {selectedRequest && selectedRequest.type === 'LOAN' && (
                <LoanAppraisalCard
                    loanId={selectedRequest.referenceId}
                    isOpen={true}
                    onClose={handleClose}
                    currentUserId={currentUserId}
                />
            )}

            {selectedRequest && selectedRequest.type === 'MEMBER' && (
                <MemberDetailsCard
                    requestId={selectedRequest.id}
                    memberId={selectedRequest.referenceId}
                    isOpen={true}
                    onClose={handleClose}
                />
            )}

            {/* Fallback for others */}
            {selectedRequest && !['LOAN', 'MEMBER'].includes(selectedRequest.type) && (
                <divWrapper onClose={handleClose}>
                    <div className="p-8 text-center bg-white rounded-3xl">
                        <h3 className="text-xl font-bold text-slate-800">Details for {selectedRequest.type}</h3>
                        <p className="text-slate-500 my-4 font-medium">No specific details card implemented for this type yet.</p>
                        <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase">System ID</p>
                            <p className="font-mono text-xs text-slate-600 mb-2">{selectedRequest.referenceId}</p>

                            <p className="text-xs font-bold text-slate-400 uppercase">Table Reference</p>
                            <p className="font-mono text-xs text-slate-600">{selectedRequest.referenceTable}</p>
                        </div>
                    </div>
                </divWrapper>
            )}
        </div>
    )
}

function divWrapper({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
            <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
                >
                    ✕
                </button>
                {children}
            </div>
        </div>
    )
}
