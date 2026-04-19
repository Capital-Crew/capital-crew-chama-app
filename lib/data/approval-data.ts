import { auth } from "@/auth"
import { db } from "@/lib/db"
import { MESSAGES } from "@/lib/constants/messages"


// Map Roles to Permissions (Simple version)
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    'SYSTEM_ADMIN': ['ALL'],
    'CHAIRPERSON': ['APPROVE_LOANS', 'APPROVE_EXPENSES', 'APPROVE_MEMBERS', 'APPROVE_WELFARE', 'APPROVE_NOTE'],
    'TREASURER': ['APPROVE_LOANS', 'APPROVE_EXPENSES', 'APPROVE_MEMBERS', 'APPROVE_WELFARE', 'APPROVE_NOTE'],
    'SECRETARY': ['APPROVE_MEMBERS', 'APPROVE_WELFARE', 'APPROVE_NOTE'],
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

    // Fetch all pending universal workflow requests
    const workflowRequests = await db.workflowRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            currentStage: true,
            workflow: true,
            actions: {
                include: {
                    actor: {
                        select: {
                            id: true,
                            role: true,
                            permissions: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    })

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
                } else if (req.entityType === 'LOAN') {
                    const loan = await db.loan.findUnique({
                        where: { id: req.entityId },
                        include: { 
                            member: true, 
                            loanProduct: true 
                        }
                    })

                    if (loan) {
                        entityDetails = {
                            ...loan,
                            amount: Number(loan.amount)
                        }
                        description = `Member Loan Application - KES ${entityDetails.amount.toLocaleString()}`
                        requesterName = loan.member.name
                    }
                } else if (req.entityType === 'MEMBER_REGISTRATION' || req.entityType === 'MEMBER') {
                    const member = await db.member.findUnique({
                        where: { id: req.entityId },
                        include: { 
                            contactInfo: true 
                        }
                    })

                    if (member) {
                        entityDetails = {
                            ...member,
                            id: member.id,
                            name: member.name,
                            memberNumber: member.memberNumber,
                            email: member.contactInfo?.email,
                            phoneNumber: member.contactInfo?.mobile || member.contact,
                            nationalId: member.nationalId,
                            status: member.status,
                        }
                        description = `New Member Registration: ${member.name}`
                        requesterName = member.name
                    }
                }
            } catch (error) {}

            // Governance Tracking
            const PRIVILEGED_ROLES = ['TREASURER', 'CHAIRPERSON', 'SECRETARY', 'SYSTEM_ADMIN'];
            const ENTITY_PERMISSION_MAP: Record<string, string[]> = {
                'LOAN': ['APPROVE_LOANS', 'APPROVE_LOAN', 'canApprove'],
                'LOAN_NOTE': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
                'LOAN_NOTE_PAYMENT': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
                'LOAN_NOTE_SETTLEMENT': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
                'MEMBER_REGISTRATION': ['APPROVE_MEMBERS', 'canApproveMember'],
                'EXPENSE': ['APPROVE_EXPENSES', 'canApprove'],
            };

            const requiredPerms = ENTITY_PERMISSION_MAP[req.entityType] || ['ALL'];

            const eligibleApprovals = req.actions.filter(a => {
                const perms = a.actor.permissions as any;
                if (!perms) return false;
                if (a.actor.role === 'SYSTEM_ADMIN') return true;

                if (Array.isArray(perms)) {
                    return perms.includes('ALL') || requiredPerms.some(p => perms.includes(p));
                }
                if (typeof perms === 'object') {
                    return perms['ALL'] === true || requiredPerms.some(p => perms[p] === true);
                }
                return false;
            });

            const hasPrivilegedRole = eligibleApprovals.some(a => PRIVILEGED_ROLES.includes(a.actor.role));

            // Permissions Check: Can the current user act on this stage?
            const userHasAlreadyVoted = req.actions.some(a => a.actorId === session.user.id && a.stageId === req.currentStageId);
            const canApprove = req.currentStage && !userHasAlreadyVoted ? hasPermission(userRole, req.currentStage.requiredRole as any, userPermissions) : false;

            // Determine Failure Reason
            const quorumRequired = req.currentStage?.minVotesRequired || 1;
            const quorumMet = eligibleApprovals.length >= quorumRequired;
            
            let failureReason: 'INSUFFICIENT_APPROVALS' | 'MISSING_REQUIRED_ROLE' | null = null;
            if (!quorumMet) {
                failureReason = 'INSUFFICIENT_APPROVALS';
            } else if (!hasPrivilegedRole) {
                failureReason = 'MISSING_REQUIRED_ROLE';
            }

            return {
                id: req.id,
                type: req.entityType === 'MEMBER_REGISTRATION' ? 'MEMBER' : req.entityType as any,
                referenceId: req.entityId,
                referenceTable: req.entityType === 'LOAN_NOTE' ? 'loan_notes' : (req.entityType === 'LOAN' ? 'loans' : 'members'),
                requesterId: req.requesterId,
                requesterName: requesterName || 'Unknown',
                description: description || `Request regarding ${req.entityType}`,
                amount: entityDetails?.amount || 0,
                status: 'PENDING',
                requiredPermission: req.currentStage?.requiredRole || 'SYSTEM_ADMIN',
                createdAt: req.createdAt,
                updatedAt: req.updatedAt,
                entityDetails,
                canApprove,
                isWorkflowRequest: true, // Flag for processor
                governance: {
                    eligibleVotes: eligibleApprovals.length,
                    quorumRequired,
                    hasPrivilegedRole,
                    failureReason,
                    missingRoleLabel: MESSAGES.GOVERNANCE.MISSING_PRIVILEGED_ROLE(),
                    isLoan: req.entityType === 'LOAN',
                    isNote: ['LOAN_NOTE', 'LOAN_NOTE_PAYMENT', 'LOAN_NOTE_SETTLEMENT'].includes(req.entityType)
                }
            }
        })
    )

    // Filter out nulls and combine
    const allRequests = enrichedWorkflow.filter(req => req !== null)
    
    // Sort combined list by date desc
    return (allRequests as any[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}


export async function getApprovalCounts() {
    try {
        const session = await auth()
        if (!session?.user) return 0

        const userRole = session.user.role || 'MEMBER'
        const userPermissions = (session.user as any).permissions

        // Fetch all pending universal workflow requests
        const workflowRequests = await db.workflowRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                currentStage: true
            }
        })

        // Count requests where the user has permission to approve the current stage
        const count = workflowRequests.filter(req => {
            if (!req.currentStage) return false;
            return hasPermission(userRole, req.currentStage.requiredRole as any, userPermissions);
        }).length;

        return count;
    } catch (error) {
        return 0
    }
}
