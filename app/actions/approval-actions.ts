'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
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

    // 1. Fetch Request (Standardized on WorkflowRequest)
    const request = await db.workflowRequest.findUnique({
        where: { id: requestId },
        include: { currentStage: true }
    })

    if (!request) throw new Error("Approval Request not found. It may have been processed or moved to history.")

    // 2. Check Permission
    const requiredPermission = request.currentStage?.requiredRole || 'SYSTEM_ADMIN';

    if (!hasPermission(session.user.role || 'MEMBER', requiredPermission, session.user.permissions)) {
        throw new Error(`Insufficient Permissions. Required role: ${requiredPermission}`)
    }

    if (request.status !== 'PENDING') throw new Error("Request already processed")

    // 3. Process Logic
    try {
        const { processWorkflowAction } = await import("./workflow-engine")
        const workflowAction = decision === 'APPROVED' ? 'APPROVE' : 'REJECT'
        
        // This handles all business logic (Activation, Payout, etc.) based on the stage completion
        await processWorkflowAction(request.id, workflowAction as any, notes)

        revalidatePath('/dashboard/approvals')
        revalidatePath('/dashboard')
        revalidatePath('/admin/approvals') // specific page
        return { success: true }
    } catch (error: any) {
        console.error('[APPROVAL_PROCESS_ERROR]:', error)
        return { error: error.message }
    }
}

export async function syncGovernance(requestId: string) {
    const { syncWorkflowRequest } = await import("./workflow-engine")
    const result = await syncWorkflowRequest(requestId)
    if (result.success) {
        revalidatePath('/admin/workflows')
        revalidatePath('/dashboard/approvals')
    }
    return result
}

export async function getGovernanceHealth() {
    const { getPendingApprovals } = await import("@/lib/data/approval-data")
    // Use existing enriched data but filter for admin consumption
    // This is essentially getPendingApprovals but returned for the Admin list
    return await getPendingApprovals() 
}
