'use client'

import React, { useState } from 'react'
import { LoanDecisionCard } from '@/components/loans/LoanDecisionCard'
import { LoanAppraisalCard } from '@/components/LoanAppraisalCard'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner' // Assuming sonner or similar toast
import { rejectLoan } from '@/app/loan-approval-actions'
import { useRouter } from 'next/navigation'

interface LoanApprovalsClientProps {
    initialLoans: any[]
    currentUser: {
        id: string
        name: string
        role: string
    }
}

export function LoanApprovalsClient({ initialLoans, currentUser }: LoanApprovalsClientProps) {
    const router = useRouter()
    const [loans, setLoans] = useState(initialLoans)

    // Selection state
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
    const [isAppraisalOpen, setIsAppraisalOpen] = useState(false)

    // Quick Reject State
    const [rejectLoanId, setRejectLoanId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [isRejecting, setIsRejecting] = useState(false)

    const handleReview = (loanId: string) => {
        setSelectedLoanId(loanId)
        setIsAppraisalOpen(true)
    }

    const handleQuickReject = (loanId: string) => {
        setRejectLoanId(loanId)
        setRejectReason('')
    }

    const confirmReject = async () => {
        if (!rejectLoanId || !rejectReason.trim()) return

        setIsRejecting(true)
        try {
            await rejectLoan(rejectLoanId, rejectReason)
            toast.success("Loan rejected successfully")

            // Optimistic update
            setLoans(prev => prev.filter(l => l.id !== rejectLoanId))
            setRejectLoanId(null)
            router.refresh() // Sync with server for sidebar counts etc
        } catch (error) {
            toast.error("Failed to reject loan")
        } finally {
            setIsRejecting(false)
        }
    }

    return (
        <>
            {loans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                    <p className="text-slate-500 text-sm">No pending loan applications.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {loans.map(loan => (
                        <LoanDecisionCard
                            key={loan.id}
                            loan={loan}
                            onReview={handleReview}
                            onQuickReject={handleQuickReject}
                        />
                    ))}
                </div>
            )}

            {/* Full Appraisal Modal */}
            {selectedLoanId && (
                <LoanAppraisalCard
                    loanId={selectedLoanId}
                    isOpen={isAppraisalOpen}
                    onClose={() => {
                        setIsAppraisalOpen(false)
                        setSelectedLoanId(null)
                        router.refresh() // Refresh to update list if approved/rejected inside modal
                    }}
                    currentUserId={currentUser.id}
                />
            )}

            {/* Quick Reject Dialog */}
            <Dialog open={!!rejectLoanId} onOpenChange={(open) => !open && setRejectLoanId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Loan Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this loan? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Rejection</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Debt-to-income ratio too high..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectLoanId(null)} disabled={isRejecting}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={confirmReject}
                            disabled={!rejectReason.trim() || isRejecting}
                        >
                            {isRejecting ? 'Rejecting...' : 'Reject Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
