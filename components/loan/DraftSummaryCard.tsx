'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { FileText, Clock, ArrowRight } from 'lucide-react'

interface DraftSummaryCardProps {
    draft: {
        id: string
        loanType: string | null
        step: number
        updatedAt: Date
    } | null
}

export function DraftSummaryCard({ draft }: DraftSummaryCardProps) {
    const router = useRouter()


    const handleContinue = () => {
        router.push('/loans/apply')
    }

    // If no draft, show standard "Apply for Loan" CTA
    if (!draft) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push('/loans/apply')}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Apply for a Loan</h3>
                <p className="text-sm text-slate-600 font-medium">
                    Start a new loan application and get funds quickly
                </p>
            </div>
        )
    }

    // If draft exists, show "Resume Application" card
    const timeAgo = getTimeAgo(new Date(draft.updatedAt))
    const loanTypeDisplay = draft.loanType || 'Loan'
    const totalSteps = 4

    return (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 shadow-md">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center animate-pulse">
                    <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    Work in Progress
                </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
                Resume Application: {loanTypeDisplay}
            </h3>

            <p className="text-sm text-slate-600 font-medium mb-4">
                Last saved <strong>{timeAgo}</strong>. You were on Step <strong>{draft.step}/{totalSteps}</strong>.
            </p>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((draft.step / totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(draft.step / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleContinue}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-bold text-sm rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
                >
                    <ArrowRight className="w-4 h-4" />
                    Continue Application
                </button>
            </div>
        </div>
    )
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds} seconds ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
}
