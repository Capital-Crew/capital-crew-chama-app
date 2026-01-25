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

function hasPermission(userRole: string, requiredPermission: string | null, userPermissions?: string[] | any) {
    if (!requiredPermission) return true // No specific permission needed

    // 1. Check Role-Based Permissions
    const rolePerms = ROLE_PERMISSIONS[userRole] || []
    if (rolePerms.includes('ALL')) return true
    if (rolePerms.includes(requiredPermission)) return true

    // 2. Check Granular User Permissions
    if (userPermissions && Array.isArray(userPermissions)) {
        if (userPermissions.includes('ALL')) return true
        if (userPermissions.includes(requiredPermission)) return true
    }

    // Parse if permissions is stored as a stringified object (unlikely with Json type, but safe)
    // or if the structure is { [key: string]: boolean }
    if (userPermissions && typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
        // Assume format { "APPROVE_LOANS": true }
        if (userPermissions[requiredPermission] === true) return true
        if (userPermissions['ALL'] === true) return true
    }

    return false
}

// ==========================================
// ACTIONS
// ==========================================

export async function getPendingApprovals() {
    const session = await auth()
    if (!session?.user) return []

    const userRole = session.user.role || 'MEMBER'
    const userPermissions = session.user.permissions

    // Fetch all pending
    const requests = await db.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        // include: { requester: false } // requesterId is just ID.
    })

    // Return ALL requests, but mark if user can approve
    return requests.map(req => ({
        ...serializeApprovalRequest(req),
        canApprove: hasPermission(userRole, req.requiredPermission, userPermissions)
    }))
}

export async function getApprovalCounts() {
    try {
        const session = await auth()
        if (!session?.user) return 0

        const userRole = session.user.role || 'MEMBER'
        // @ts-ignore
        const userPermissions = session.user.permissions

        // 1. Get Base Role Permissions
        const rolePerms = ROLE_PERMISSIONS[userRole] || []

        // 2. Merge Granular Permissions
        let combinedPermissions: string[] = [...rolePerms]

        if (userPermissions && Array.isArray(userPermissions)) {
            combinedPermissions = [...combinedPermissions, ...userPermissions]
        } else if (userPermissions && typeof userPermissions === 'object') {
            // If object (legacy/map), assume keys are permissions
            const extraKeys = Object.keys(userPermissions).filter(k => userPermissions[k] === true)
            combinedPermissions = [...combinedPermissions, ...extraKeys]
        }

        // 3. Check for ALL
        const hasAll = combinedPermissions.includes('ALL')

        // Check if user has permission to approve loans
        const canApproveLoans = hasAll ||
            combinedPermissions.includes('APPROVE_LOANS') ||
            combinedPermissions.includes('canApprove') ||
            ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(userRole)

        let totalCount = 0

        if (canApproveLoans) {
            const loanCount = await db.loan.count({
                where: { status: 'PENDING_APPROVAL' }
            })
            totalCount += loanCount
        }

        // Future: Add Member/Expense counts here when implemented

        return totalCount
    } catch (error) {
        console.error('Error fetching approval counts:', error)
        return 0 // Return 0 on error to prevent layout crash
    }
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
    if (!hasPermission(session.user.role || 'MEMBER', request.requiredPermission, session.user.permissions)) {
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
