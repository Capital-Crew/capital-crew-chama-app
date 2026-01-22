'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ApprovalStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
// import { approveLoan } from "./loan-actions"
import { serializeApprovalRequest } from "@/lib/serializers"
// I'll leave the "Trigger" logic as TODO or implementing basic if-blocks

// ==========================================
// CONFIGURATION
// ==========================================

// Map Roles to Permissions (Simple version)
const ROLE_PERMISSIONS: Record<string, string[]> = {
    'SYSTEM_ADMIN': ['ALL'],
    'CHAIRPERSON': ['APPROVE_LOANS', 'APPROVE_EXPENSES', 'APPROVE_MEMBERS', 'APPROVE_WELFARE'],
    'TREASURER': ['APPROVE_LOANS', 'APPROVE_EXPENSES', 'APPROVE_MEMBERS', 'APPROVE_WELFARE'],
    'SECRETARY': ['APPROVE_MEMBERS', 'APPROVE_WELFARE'],
    'MEMBER': []
}

function hasPermission(userRole: string, requiredPermission: string | null) {
    if (!requiredPermission) return true // No specific permission needed
    const perms = ROLE_PERMISSIONS[userRole] || []
    if (perms.includes('ALL')) return true
    return perms.includes(requiredPermission)
}

// ==========================================
// ACTIONS
// ==========================================

export async function getPendingApprovals() {
    const session = await auth()
    if (!session?.user) return []

    const userRole = session.user.role || 'MEMBER'

    // Fetch all pending
    const requests = await db.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        // include: { requester: false } // requesterId is just ID.
    })

    // Filter by Permission (In-memory filter for RBAC flexibility)
    const filtered = requests.filter(req => hasPermission(userRole, req.requiredPermission))

    return filtered.map(serializeApprovalRequest)
}

export async function getApprovalCounts() {
    const session = await auth()
    if (!session?.user) return 0

    const userRole = session.user.role || 'MEMBER'

    // Optimized Count Query
    const userPermissions = ROLE_PERMISSIONS[userRole] || []

    // If Admin/All access
    if (userPermissions.includes('ALL')) {
        return await db.approvalRequest.count({
            where: { status: 'PENDING' }
        })
    }

    // Filter by specific permissions
    return await db.approvalRequest.count({
        where: {
            status: 'PENDING',
            requiredPermission: { in: userPermissions }
        }
    })
}

import { submitLoanApproval } from "@/app/loan-approval-actions"

// ... imports

export async function processApproval(requestId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    // 1. Fetch Request
    const request = await db.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request) throw new Error("Request not found")

    // 2. Check Permission
    if (!hasPermission(session.user.role || 'MEMBER', request.requiredPermission)) {
        throw new Error("Insufficient Permissions")
    }

    if (request.status !== 'PENDING') throw new Error("Request already processed")

    // 3. Process Logic
    try {
        // LOAN SPECIAL HANDLING
        // We use the robust voting system for loans which handles its own DB transactions and logic.
        if (request.type === 'LOAN') {
            await submitLoanApproval(request.referenceId, decision, notes || `Quick ${decision} via Dashboard`)
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
        console.error("Approval Error:", error)
        return { error: error.message }
    }
}
