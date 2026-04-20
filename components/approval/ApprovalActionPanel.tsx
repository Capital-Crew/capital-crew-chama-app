import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Send, XCircle, History as HistoryIcon, UserCog } from 'lucide-react'
import { ApprovalHistoryDrawer } from './ApprovalHistoryDrawer'
import { DelegationPanel } from './DelegationPanel'
import { handleWorkflowTransition } from '@/app/actions/approval-workflow'
import { toast } from '@/lib/toast'

interface ApprovalActionPanelProps {
    status: string // 'APPLICATION', 'PENDING_APPROVAL', 'APPROVED'
    entityType: 'LOAN' | 'MEMBER' | 'EXPENSE' | 'WELFARE' | 'ACCOUNT_TRANSFER'
    entityId: string
    canEdit: boolean
}

export function ApprovalActionPanel({ status, entityType, entityId, canEdit }: ApprovalActionPanelProps) {
    const router = useRouter()
    const [submitting, setSubmitting] = useState<'SEND' | 'CANCEL' | null>(null)
    const [pendingAction, setPendingAction] = useState<'SEND' | 'CANCEL' | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [delegationOpen, setDelegationOpen] = useState(false)

    const requestAction = (action: 'SEND' | 'CANCEL') => {
        setPendingAction(action)
    }

    const confirmAction = async () => {
        if (!pendingAction) return
        const action = pendingAction
        setPendingAction(null)
        setSubmitting(action)
        try {
            const res = await handleWorkflowTransition(entityType, entityId, action)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(action === 'SEND' ? 'Request submitted for approval' : 'Request cancelled')
                router.refresh()
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setSubmitting(null)
        }
    }

    const isBusy = submitting !== null

    return (
        <div className="flex flex-col gap-3">
            {pendingAction && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        {pendingAction === 'SEND'
                            ? 'Submit this request for approval?'
                            : 'Are you sure you want to cancel this request?'}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => setPendingAction(null)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
                        >
                            No, go back
                        </button>
                        <button
                            onClick={confirmAction}
                            className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors ${pendingAction === 'SEND' ? 'bg-slate-900 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            Yes, confirm
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                {status === 'APPLICATION' && canEdit && (
                    <button
                        onClick={() => requestAction('SEND')}
                        disabled={isBusy || !!pendingAction}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                        {submitting === 'SEND' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting === 'SEND' ? 'Submitting...' : 'Submit Request'}
                    </button>
                )}

                {status === 'PENDING_APPROVAL' && canEdit && (
                    <button
                        onClick={() => requestAction('CANCEL')}
                        disabled={isBusy || !!pendingAction}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase hover:bg-red-100 disabled:opacity-50 transition-all"
                    >
                        {submitting === 'CANCEL' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        {submitting === 'CANCEL' ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                )}

                {['APPLICATION', 'PENDING_APPROVAL'].includes(status) && canEdit && (
                    <button
                        onClick={() => setDelegationOpen(true)}
                        disabled={isBusy}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold uppercase hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <UserCog className="w-4 h-4" />
                        Delegate
                    </button>
                )}

                <button
                    onClick={() => setHistoryOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-all"
                >
                    <HistoryIcon className="w-4 h-4" />
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
        </div>
    )
}
