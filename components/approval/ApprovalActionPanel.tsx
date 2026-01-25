'use client'

import { useState } from 'react'
import { ApprovalHistoryDrawer } from './ApprovalHistoryDrawer'
import { DelegationPanel } from './DelegationPanel'
import { handleWorkflowTransition } from '@/app/actions/approval-workflow'
import { toast } from '@/lib/toast'
import { Loader2, Send, XCircle, History, UserCog } from 'lucide-react'

interface ApprovalActionPanelProps {
    status: string // 'APPLICATION', 'PENDING_APPROVAL', 'APPROVED'
    entityType: 'LOAN' | 'MEMBER' | 'EXPENSE' | 'WELFARE' | 'ACCOUNT_TRANSFER'
    entityId: string
    canEdit: boolean
}

export function ApprovalActionPanel({ status, entityType, entityId, canEdit }: ApprovalActionPanelProps) {
    const [submitting, setSubmitting] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [delegationOpen, setDelegationOpen] = useState(false)

    const onTransition = async (action: 'SEND' | 'CANCEL') => {
        if (!confirm(action === 'SEND' ? 'Submit this request for approval?' : 'Are you sure you want to cancel this request?')) return

        setSubmitting(true)
        try {
            const res = await handleWorkflowTransition(entityType, entityId, action)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(action === 'SEND' ? 'Request Submitted' : 'Request Cancelled')
            }
        } catch (e) {
            toast.error('Workflow failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* SEND REQUEST (Only in APPLICATION stage) */}
            {status === 'APPLICATION' && canEdit && (
                <button
                    onClick={() => onTransition('SEND')}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Request
                </button>
            )}

            {/* CANCEL REQUEST (Only in PENDING stage) */}
            {status === 'PENDING_APPROVAL' && canEdit && (
                <button
                    onClick={() => onTransition('CANCEL')}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase hover:bg-red-100 disabled:opacity-50 transition-all"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Cancel Request
                </button>
            )}

            {/* DELEGATE (Always Visible) */}
            <button
                onClick={() => setDelegationOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold uppercase hover:bg-blue-100 transition-all"
            >
                <UserCog className="w-4 h-4" />
                Delegate
            </button>

            {/* HISTORY (Always Visible) */}
            <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-all"
            >
                <History className="w-4 h-4" />
                History
            </button>

            <ApprovalHistoryDrawer
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                entityType={entityType}
                entityId={entityId}
            />

            <DelegationPanel
                isOpen={delegationOpen}
                onClose={() => setDelegationOpen(false)}
            />
        </div>
    )
}
