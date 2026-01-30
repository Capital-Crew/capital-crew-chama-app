import { auth } from "@/auth"
import { db } from "@/lib/db"
import { serializeApprovalRequest } from "@/lib/serializers"

// ==========================================
// CONFIGURATION
// ==========================================

// Map Roles to Permissions (Simple version)
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    'SYSTEM_ADMIN': ['ALL'],
    'CHAIRPERSON': ['APPROVE_LOANS', 'APPROVE_EXPENSES', 'APPROVE_MEMBERS', 'APPROVE_WELFARE'],
    'TREASURER': ['APPROVE_LOANS', 'APPROVE_EXPENSES', 'APPROVE_MEMBERS', 'APPROVE_WELFARE'],
    'SECRETARY': ['APPROVE_MEMBERS', 'APPROVE_WELFARE'],
    'MEMBER': []
}

export function hasPermission(userRole: string, requiredPermission: string | null, userPermissions?: string[] | any) {
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

    if (userPermissions && typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
        if (userPermissions[requiredPermission] === true) return true
        if (userPermissions['ALL'] === true) return true
    }

    return false
}

// ==========================================
// DATA FETCHERS (NOT Server Actions)
// ==========================================

export async function getPendingApprovals() {
    const session = await auth()
    if (!session?.user) return []

    const userRole = session.user.role || 'MEMBER'
    const userPermissions = (session.user as any).permissions

    // Fetch all pending
    const requests = await db.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
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
        const userPermissions = (session.user as any).permissions

        // 1. Get Base Role Permissions
        const rolePerms = ROLE_PERMISSIONS[userRole] || []

        // 2. Merge Granular Permissions
        let combinedPermissions: string[] = [...rolePerms]

        if (userPermissions && Array.isArray(userPermissions)) {
            combinedPermissions = [...combinedPermissions, ...userPermissions]
        } else if (userPermissions && typeof userPermissions === 'object') {
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

        return totalCount
    } catch (error) {
        console.error('Error fetching approval counts:', error)
        return 0
    }
}
