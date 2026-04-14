'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { serializeApprovalRequest } from "@/lib/serializers"
import { hasPermission } from "@/lib/data/approval-data"

import { getPendingApprovals as _getPendingApprovals, getApprovalCounts as _getApprovalCounts } from "@/lib/data/approval-data"

// Wrapper functions to make them compatible with "use server"
export async function getPendingApprovals() {
    return await _getPendingApprovals()
}

export async function getApprovalCounts() {
    return await _getApprovalCounts()
}


export async function processApproval(requestId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    // 1. Fetch Request (Check both legacy and universal tables)
    let request: any = await db.approvalRequest.findUnique({ where: { id: requestId } })
    let isWorkflow = false

    if (!request) {
        request = await db.workflowRequest.findUnique({
            where: { id: requestId },
            include: { currentStage: true }
        })
        isWorkflow = true
    }

    if (!request) throw new Error("Request not found")

    // 2. Check Permission
    const requiredPermission = isWorkflow 
        ? (request.currentStage?.requiredRole || 'SYSTEM_ADMIN') 
        : request.requiredPermission;

    if (!hasPermission(session.user.role || 'MEMBER', requiredPermission, session.user.permissions)) {
        throw new Error("Insufficient Permissions")
    }

    if (request.status !== 'PENDING') throw new Error("Request already processed")

    // 3. Process Logic
    try {
        // LOAN SPECIAL HANDLING
        // We use the robust voting system for loans which handles its own DB transactions and logic.
        if (request.type === 'LOAN') {
            const { submitLoanApproval } = await import("@/app/loan-approval-actions")
            const result: any = await submitLoanApproval(request.referenceId, decision, notes || `Quick ${decision} via Dashboard`)
            if (result?.error) return { error: result.error }
            return { success: true }
        }

        // B. Trigger Business Logic based on Type
        if (isWorkflow) {
            // For now, only LOAN_NOTE uses WorkflowRequest
            if (request.entityType === 'LOAN_NOTE') {
                const { handleWorkflowTransition } = await import("./approval-workflow")
                const workflowAction = decision === 'APPROVED' ? 'APPROVE' : 'REJECT'
                await handleWorkflowTransition('LOAN_NOTE' as any, request.entityId, workflowAction) 
            }
        } else {
            // GENERIC HANDLING FOR LEGACY TYPES
            await db.$transaction(async (tx) => {
                // A. Update the Request
                await tx.approvalRequest.update({
                    where: { id: requestId },
                    data: {
                        status: decision,
                        approverId: session.user.id,
                        approverName: session.user.name,
                        decisionNotes: notes,
                        approvedAt: new Date()
                    }
                })

                // B. Trigger Business Logic based on Type
                if (decision === 'APPROVED') {
                    switch (request.type) {
                        case 'MEMBER':
                            // Activate Member
                            await tx.member.update({
                                where: { id: request.referenceId },
                                data: { status: 'ACTIVE' }
                            })
                            break;
                        // Add other cases
                    }
                } else {
                    switch (request.type) {
                        case 'MEMBER':
                            // Maybe mark as REJECTED in member table too if needed
                            break;
                    }
                }
            })
        }

        revalidatePath('/dashboard/approvals')
        revalidatePath('/dashboard')
        revalidatePath('/admin/approvals') // specific page
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
