'use client'

import React, { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { processApproval } from '@/app/actions/approval-actions'
import { User, CreditCard, ShieldCheck } from 'lucide-react'

interface MemberDetailsCardProps {
    requestId: string
    memberId: string
    isOpen: boolean
    onClose: () => void
}

export function MemberDetailsCard({ requestId, memberId, isOpen, onClose }: MemberDetailsCardProps) {
    const [member, setMember] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen && memberId) {
            fetchMember()
        }
    }, [isOpen, memberId])

    const fetchMember = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/members/${memberId}`)
            if (!response.ok) throw new Error("Failed to fetch")
            const data = await response.json()
            setMember(data)
        } catch (e) {
            toast.error("Could not load member details")
        } finally {
            setLoading(false)
        }
    }

    const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${decision} this member?`)) return
        setProcessing(true)
        try {
            await processApproval(requestId, decision, notes)
            toast.success(`Member ${decision === 'APPROVED' ? 'Approved' : 'Rejected'} Successfully`)
            onClose()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setProcessing(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
                    <div>
                        <p className="text-xs font-black text-[#00c2e0] uppercase tracking-widest mb-1">Application Review</p>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Member</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="w-8 h-8 border-4 border-[#00c2e0] border-t-transparent rounded-full animate-spin" />
                            <p className="font-bold text-xs uppercase tracking-widest">Loading Profile...</p>
                        </div>
                    ) : member ? (
                        <div className="space-y-8">
                            {/* Profile Header */}
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-[#00c2e0] to-[#019ab3] rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-cyan-500/20">
                                    {member.name?.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-slate-800">{member.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                        <User className="w-4 h-4" />
                                        <span>{member.phoneNumber}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>{member.email}</span>
                                    </div>
                                    <div className="inline-flex mt-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                        Pending Approval
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-slate-200 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white mb-4 flex items-center justify-center shadow-sm text-slate-400">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">ID Number</label>
                                    <p className="font-bold text-lg text-slate-800 tracking-tight">{member.idNumber || 'N/A'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-slate-200 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white mb-4 flex items-center justify-center shadow-sm text-slate-400">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">KRA PIN</label>
                                    <p className="font-bold text-lg text-slate-800 tracking-tight">{member.kraPin || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Wallet Info */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100/50">
                                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    Wallet Initialization
                                </h4>
                                <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                                    Upon approval, a minimal wallet (Savings Account #2000) will be automatically provisioned for this member.
                                    Transactions will be enabled immediately.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-slate-800">Member Not Found</h3>
                            <p className="text-slate-500 text-sm mt-1">Ref ID: {memberId}</p>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-4">
                    <textarea
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#00c2e0]/20 outline-none resize-none transition-all"
                        placeholder="Add decision notes (optional)..."
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleDecision('REJECTED')}
                            disabled={processing}
                            className="px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all uppercase text-xs tracking-widest"
                        >
                            Reject Application
                        </button>
                        <button
                            onClick={() => handleDecision('APPROVED')}
                            disabled={processing}
                            className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Approve Member'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
