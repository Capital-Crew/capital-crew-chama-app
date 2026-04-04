'use client'

import React from 'react'
import { XIcon, BanknoteIcon } from 'lucide-react'
import { LoanRepaymentForm } from './LoanRepaymentForm'

interface LoanRepaymentModalProps {
    isOpen: boolean
    onClose: () => void
    memberId: string
    initialLoanId?: string
    onSuccess?: (newBalance: number) => void
}

export function LoanRepaymentModal({ isOpen, onClose, memberId, initialLoanId, onSuccess }: LoanRepaymentModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0A192F]/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 font-sans">
                
                {/* Header */}
                <div className="bg-gradient-to-br from-[#0A192F] to-[#001E2B] p-8 flex justify-between items-start shrink-0 relative overflow-hidden text-white">
                    <div className="absolute right-0 top-0 opacity-10 -mr-10 -mt-10">
                        <BanknoteIcon className="w-48 h-48 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2 font-mono">Loan Liquidation Protocol</p>
                        <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                            <BanknoteIcon className="w-8 h-8 text-cyan-400" />
                            Repay <span className="text-cyan-400">Loan</span>
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all text-white relative z-10"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-10 overflow-y-auto">
                    <LoanRepaymentForm 
                        memberId={memberId}
                        initialLoanId={initialLoanId}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    )
}
