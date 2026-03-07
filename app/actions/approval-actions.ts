'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ApprovalStatus } from "@prisma/client"
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

    // 1. Fetch Request
    const request = await db.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request) throw new Error("Request not found")

    // 2. Check Permission
    if (!hasPermission(session.user.role || 'MEMBER', request.requiredPermission, session.user.permissions)) {
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

        // GENERIC HANDLING FOR OTHER TYPES
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
                // REJECTED Logic
                // Generic rejection usually doesn't need to do much besides updating the request status,
                // but if we need to update the reference table, do it here.
                switch (request.type) {
                    case 'MEMBER':
                        // Maybe mark as REJECTED in member table too if needed
                        break;
                }
            }
        })

        revalidatePath('/dashboard/approvals')
        revalidatePath('/dashboard')
        revalidatePath('/admin/approvals') // specific page
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
