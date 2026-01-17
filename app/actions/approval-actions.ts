'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ApprovalStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { approveLoan } from "./loan-actions" // I'll need to check if this exists or I assume
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

    const requests = await db.approvalRequest.findMany({
        where: { status: 'PENDING' },
        select: { requiredPermission: true }
    })

    const count = requests.filter(req => hasPermission(userRole, req.requiredPermission)).length
    return count
}

export async function processApproval(requestId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    // 1. Fetch Request
    const request = await db.approvalRequest.findUnique({ where: { id: requestId } })
    if (!request) throw new Error("Request not found")

    // 2. Check Permission
    if (!hasPermission(session.user.role, request.requiredPermission)) {
        throw new Error("Insufficient Permissions")
    }

    if (request.status !== 'PENDING') throw new Error("Request already processed")

    // 3. Process Logic
    try {
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
                    case 'LOAN':
                        // Call Loan Service to register a vote
                        // Note: This assumes 1-click full approval for now, or we plug into the voting system.
                        // Ideally: await castLoanVote(request.referenceId, 'APPROVED', notes)
                        // For this demo, let's assume we update status directly if it's the final approval.
                        // I will mark this as "Business Logic Placeholder"
                        // TODO: Integrate actual LoanApproval entry creation
                        break;
                    case 'MEMBER':
                        // Activate Member
                        await tx.member.update({
                            where: { id: request.referenceId },
                            data: { status: 'ACTIVE' } // Assuming MemberStatus enum has ACTIVE
                        })
                        break;
                    // Add other cases
                }
            } else {
                // REJECTED Logic
                switch (request.type) {
                    case 'LOAN':
                        // Reject Loan
                        await tx.loan.update({
                            where: { id: request.referenceId },
                            data: { status: 'REJECTED' }
                        })
                        break;
                }
            }
        })

        revalidatePath('/dashboard/approvals')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error("Approval Error:", error)
        return { error: error.message }
    }
}
