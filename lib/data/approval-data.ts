import { auth } from "@/auth"
import { db } from "@/lib/db"
import { serializeApprovalRequest } from "@/lib/serializers"


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


export async function getPendingApprovals() {
    const session = await auth()
    if (!session?.user) return []

    const userRole = session.user.role || 'MEMBER'
    const userPermissions = (session.user as any).permissions

    // Fetch all pending legacy requests
    const legacyRequests = await db.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
    })

    // Fetch all pending universal workflow requests
    const workflowRequests = await db.workflowRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            currentStage: true,
            workflow: true
        },
        orderBy: { createdAt: 'desc' },
    })

    // Fetch related entities for rich display
    const enrichedLegacy = await Promise.all(
        legacyRequests.map(async (req) => {
            let entityDetails: any = null

            try {
                // Fetch entity details based on type
                if (req.type === 'LOAN') {
                    entityDetails = await db.loan.findUnique({
                        where: { id: req.referenceId },
                        select: {
                            id: true,
                            loanApplicationNumber: true,
                            amount: true,
                            installments: true,
                            interestRate: true,
                            status: true,
                            approvals: {
                                select: {
                                    approverId: true,
                                    decision: true
                                }
                            },
                            member: {
                                select: {
                                    id: true,
                                    name: true,
                                    memberNumber: true,
                                    phoneNumber: true
                                }
                            },
                            loanProduct: {
                                select: {
                                    productName: true,
                                    maxAmount: true,
                                    interestRate: true
                                }
                            }
                        }
                    })

                    // Filter out if user has already voted
                    if (entityDetails) {
                        const hasVoted = entityDetails.approvals.some((a: any) => a.approverId === session.user.memberId)
                        if (hasVoted) return null // Skip this request
                    }
                } else if (req.type === 'MEMBER') {
                    entityDetails = await db.member.findUnique({
                        where: { id: req.referenceId },
                        select: {
                            id: true,
                            name: true,
                            memberNumber: true,
                            email: true,
                            phoneNumber: true,
                            nationalId: true,
                            status: true,
                            createdAt: true
                        }
                    })
                }
            } catch (error) {
            }

            return {
                ...serializeApprovalRequest(req),
                canApprove: hasPermission(userRole, req.requiredPermission, userPermissions),
                entityDetails // Attach the related entity data
            }
        })
    )

    const enrichedWorkflow = await Promise.all(
        workflowRequests.map(async (req) => {
            let entityDetails: any = null
            let description = ""
            let requesterName = ""

            try {
                if (req.entityType === 'LOAN_NOTE') {
                    const note = await db.loanNote.findUnique({
                        where: { id: req.entityId },
                        include: { floater: true }
                    })

                    if (note) {
                        entityDetails = {
                            ...note,
                            amount: note.totalAmount, // Map for UI compatibility
                        }
                        description = `Investment Note: ${note.title} (Target: KES ${note.totalAmount.toLocaleString()})`
                        requesterName = note.floater.name || 'Unknown'
                    }
                }
            } catch (error) {}

            // Permissions Check: Can the current user act on this stage?
            const canApprove = req.currentStage ? hasPermission(userRole, req.currentStage.requiredRole as any, userPermissions) : false;

            return {
                id: req.id,
                type: req.entityType as any,
                referenceId: req.entityId,
                referenceTable: req.entityType === 'LOAN_NOTE' ? 'loan_notes' : 'Unknown',
                requesterId: req.requesterId,
                requesterName: requesterName,
                description: description,
                amount: entityDetails?.amount || 0,
                status: 'PENDING',
                requiredPermission: req.currentStage?.requiredRole || 'SYSTEM_ADMIN',
                createdAt: req.createdAt,
                updatedAt: req.updatedAt,
                entityDetails,
                canApprove,
                isWorkflowRequest: true // Flag for processor
            }
        })
    )

    // Filter out nulls and combine
    const allRequests = [...enrichedLegacy, ...enrichedWorkflow].filter(req => req !== null)
    
    // Sort combined list by date desc
    return (allRequests as any[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
                where: {
                    status: 'PENDING_APPROVAL',
                    // Exclude loans where I have already voted
                    approvals: {
                        none: {
                            approverId: session.user.memberId
                        }
                    }
                }
            })
            totalCount += loanCount
        }

        return totalCount
    } catch (error) {
        return 0
    }
}
