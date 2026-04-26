'use client'

import React, { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { processApproval } from '@/app/actions/approval-actions'
import { User, CreditCard, ShieldCheck, Check, X, Info } from 'lucide-react'
import { useOptimisticAction } from '@/hooks/useOptimisticAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'
import { cn } from '@/lib/utils'
import { ProcessingOverlay } from '../shared/ProcessingOverlay'

interface MemberDetailsCardProps {
    requestId: string
    memberId: string
    isOpen: boolean
    onClose: () => void
}

export function MemberDetailsCard({ requestId, memberId, isOpen, onClose }: MemberDetailsCardProps) {
    const [member, setMember] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [notes, setNotes] = useState('')

    const { execute: executeDecision, isPending: processing, error: decisionError } = useOptimisticAction();

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
        
        await executeDecision(async () => {
            try {
                await processApproval(requestId, decision, notes)
                toast.success(`Member ${decision === 'APPROVED' ? 'Approved' : 'Rejected'} Successfully`)
                onClose()
                return { success: true }
            } catch (e: any) {
                return { success: false, error: e.message }
            }
        }, {
            onOptimisticUpdate: () => {
                // Optimistically mark member as processed
                setMember(prev => prev ? ({ ...prev, status: decision }) : null);
            }
        });
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
                {}
                <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-1.5 focus:outline-none">Decision Terminal</p>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <User className="w-6 h-6 text-slate-400" />
                            Enrollment Review
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                    >
                        ✕
                    </button>
                </div>

                {}
                <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/20">
                    <FormError message={decisionError} className="mb-6" />

                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-5">
                            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Profile Data...</p>
                        </div>
                    ) : member ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {}
                            <div className="flex items-center gap-6">
                                <div className="w-28 h-28 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-cyan-500/20 rotate-3 border-4 border-white">
                                    {member.name?.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{member.name}</h3>
                                    <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-black text-slate-400 tracking-tight">#{member.memberNumber || 'NEW'}</span>
                                        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {member.phoneNumber}</span>
                                    </div>
                                    <div className={cn(
                                        "inline-flex mt-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                        member.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        member.status === 'REJECTED' ? "bg-red-50 text-red-600 border-red-100" :
                                        "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                    )}>
                                        {member.status || 'Pending Review'}
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailTile icon={<CreditCard className="w-5 h-5" />} label="Identification No." value={member.idNumber || 'Not Provided'} />
                                <DetailTile icon={<ShieldCheck className="w-5 h-5" />} label="Tax Compliance (PIN)" value={member.kraPin || 'Not Verified'} />
                            </div>

                            {}
                            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl shadow-cyan-600/10 relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <ShieldCheck className="w-40 h-40" />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        System Integration
                                    </h4>
                                    <p className="text-sm font-bold text-blue-50 leading-relaxed opacity-90">
                                        Approving this application will automatically initialize the member's <strong className="text-white">Savings Wallet (KES)</strong> and provision their biometric identity for mobile access.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <User className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Critical Error: Profile Missing</h3>
                            <p className="text-slate-500 font-bold mt-2 text-sm">Target Reference: <span className="font-mono text-xs">{memberId}</span></p>
                        </div>
                    )}
                </div>

                {}
                <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-20">
                    <div className="relative">
                        <textarea
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-cyan-500/10 outline-none resize-none transition-all"
                            placeholder="Add administrative notes or reason for rejection..."
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                        <div className="absolute top-4 right-4 opacity-5">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap md:flex-nowrap gap-4">
                        <button
                            onClick={() => handleDecision('REJECTED')}
                            disabled={processing || loading}
                            className="flex-1 px-8 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] hover:border-red-100 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                        >
                            Reject Application
                        </button>
                        <SubmitButton
                            isPending={processing}
                            label="Approve & Enroll"
                            pendingLabel="Enrolling Member..."
                            onClick={() => handleDecision('APPROVED')}
                            disabled={loading}
                            icon={<Check className="w-4 h-4 mr-2" />}
                            className="flex-[1.5] bg-slate-900 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-cyan-600 transition-all"
                        />
                    </div>
                </div>
            </div>

            <ProcessingOverlay 
                isOpen={processing}
                stage="Finalizing member status..."
            />
        </div>
    )
}

function DetailTile({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-cyan-200 hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 mb-5 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-cyan-50 group-hover:text-cyan-500 group-hover:border-cyan-100 transition-all">
                {icon}
            </div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
            <p className="font-black text-lg text-slate-800 tracking-tight">{value}</p>
        </div>
    );
}
