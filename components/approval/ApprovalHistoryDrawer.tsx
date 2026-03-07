'use client'

import { useState, useEffect } from 'react'
import { getApprovalHistory } from '@/app/actions/approval-workflow'
import { Loader2, X } from 'lucide-react'

interface ApprovalHistoryDrawerProps {
    isOpen: boolean
    onClose: () => void
    entityType: 'LOAN' | 'MEMBER' | 'EXPENSE' | 'WELFARE' | 'ACCOUNT_TRANSFER'
    entityId: string
}

export function ApprovalHistoryDrawer({ isOpen, onClose, entityType, entityId }: ApprovalHistoryDrawerProps) {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setLoading(true)
            getApprovalHistory(entityType, entityId)
                .then(setHistory)
                .finally(() => setLoading(false))
        }
    }, [isOpen, entityType, entityId])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Workflow History</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No history recorded yet.
                        </div>
                    ) : (
                        <div className="space-y-6 relative border-l-2 border-slate-100 ml-4">
                            {history.map((item) => (
                                <div key={item.id} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.action === 'SUBMITTED' ? 'bg-blue-500' :
                                        item.action === 'APPROVED' ? 'bg-green-500' :
                                            item.action === 'REJECTED' ? 'bg-red-500' :
                                                'bg-slate-400'
                                        }`} />

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-sm">{item.actorUsername}</span>
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-bold border border-slate-200 uppercase tracking-wide">
                                                {item.action}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </span>
                                        {item.metadata && (
                                            <pre className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-500 overflow-x-auto mt-1">
                                                {JSON.stringify(item.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
