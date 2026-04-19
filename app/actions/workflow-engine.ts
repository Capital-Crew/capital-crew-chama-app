'use server'

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import { EntityType, ApprovalAction, WorkflowStatus, UserRole, Prisma } from "@prisma/client" // Ensure these are exported from generated client once migrated
import { revalidatePath } from "next/cache"
import { MESSAGES } from "@/lib/constants/messages"

// Governance Constants
export const PRIVILEGED_ROLES = ['TREASURER', 'CHAIRPERSON', 'SECRETARY', 'SYSTEM_ADMIN'];

// Map entity types to the required permission identifiers in string format
export const ENTITY_PERMISSION_MAP: Record<string, string[]> = {
    'LOAN': ['APPROVE_LOANS', 'APPROVE_LOAN', 'canApprove'],
    'LOAN_NOTE': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
    'LOAN_NOTE_PAYMENT': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
    'LOAN_NOTE_SETTLEMENT': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
    'MEMBER': ['APPROVE_MEMBERS', 'canApproveMember'],
    'EXPENSE': ['APPROVE_EXPENSES', 'canApprove'],
};

// Helper to check role hierarchy or specific permission
function hasRole(userRole: string, requiredRole: string) {
    if (userRole === 'SYSTEM_ADMIN') return true
    if (userRole === requiredRole) return true
    return false
}

async function checkWorkflowPermission(user: any, request: any): Promise<boolean> {
    const requiredRole = request.currentStage.requiredRole;

    // 1. Basic Role Check
    if (hasRole(user.role, requiredRole)) return true;

    // Special: For Loan Workflows, any "High Authority" role can approve
    const highAuthorityRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'];
    if (request.entityType === 'LOAN' && (highAuthorityRoles.includes(user.role) || user.role === 'SYSTEM_ADMIN')) {
        return true;
    }

    // 2. Granular Permissions Check
    const userPermissions = user.permissions;
    const requiredPerms = ENTITY_PERMISSION_MAP[request.entityType] || ['ALL'];

    if (userPermissions) {
        if (Array.isArray(userPermissions)) {
            if (userPermissions.includes("ALL")) return true;
            if (requiredPerms.some(p => userPermissions.includes(p))) return true;
        } else if (typeof userPermissions === "object") {
            const p = userPermissions as any;
            if (p["ALL"] === true) return true;
            if (requiredPerms.some(perm => p[perm] === true)) return true;
        }
    }

    // 3. Delegated Authority Check
    const activeDelegations = await prisma.approvalDelegation.findMany({
        where: {
            toUserId: user.id,
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            AND: [{ OR: [{ entityId: request.entityId, entityType: request.entityType }, { entityId: null }] }],
        },
        include: { fromUser: true },
    });

    const hasValidDelegation = activeDelegations.some((d) =>
        hasRole(d.fromUser.role, requiredRole)
    );

    return hasValidDelegation;
}

/**
 * Initiate a workflow for a new Entity (e.g. Loan Application)
 */
export async function initiateWorkflow(entityType: EntityType, entityId: string, requesterId: string, version: number = 1) {
    // 1. Find Active Workflow Definition for this Type
    let definition = await prisma.workflowDefinition.findUnique({
        where: { entityType },
        include: { stages: { orderBy: { stepNumber: 'asc' } } }
    })

    // AUTO-SEED if missing (for dev convenience)
    if (!definition) {
        if (entityType === 'LOAN') {
            await createDefaultLoanWorkflow()
            definition = await prisma.workflowDefinition.findUnique({
                where: { entityType },
                include: { stages: { orderBy: { stepNumber: 'asc' } } }
            })
        } else if (entityType === 'MEMBER') {
            await createDefaultMemberWorkflow()
            definition = await prisma.workflowDefinition.findUnique({
                where: { entityType },
                include: { stages: { orderBy: { stepNumber: 'asc' } } }
            })
        } else if (entityType === 'EXPENSE') {
            await createDefaultExpenseWorkflow()
            definition = await prisma.workflowDefinition.findUnique({
                where: { entityType },
                include: { stages: { orderBy: { stepNumber: 'asc' } } }
            })
        }
    }

    if (!definition) {
        throw new Error(`No active workflow defined for ${entityType}`)
    }

    if (definition.stages.length === 0) {
        throw new Error(`Workflow for ${entityType} has no stages`)
    }

    const firstStage = definition.stages[0]

    // 2. Resolve Requester ID (if memberId provided instead of userId)
    let actualRequesterId = requesterId
    if (entityType === 'LOAN') {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: requesterId },
                    { memberId: requesterId }
                ]
            },
            select: { id: true }
        })
        if (user) {
            actualRequesterId = user.id
        }
    }

    // 2. Create the Request
    const request = await prisma.workflowRequest.create({
        data: {
            workflowId: definition.id,
            currentStageId: firstStage.id,
            entityType,
            entityId,
            requesterId: actualRequesterId,
            status: WorkflowStatus.PENDING,
            version
        }
    })

    return request
}

/**
 * Process an action on a workflow request (Approve/Reject)
 */
export async function processWorkflowAction(requestId: string, action: ApprovalAction, notes?: string) {
    try {
        const session = await auth()
        if (!session?.user) return { success: false, error: MESSAGES.AUTH.UNAUTHORIZED }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return { success: false, error: "User not found" }

        // 1. Fetch Request with Current Stage info
        const request = await prisma.workflowRequest.findUnique({
            where: { id: requestId },
            include: {
                currentStage: true,
                workflow: { include: { stages: { orderBy: { stepNumber: 'asc' } } } }
            }
        })

        if (!request) return { success: false, error: MESSAGES.GOVERNANCE.REQ_NOT_FOUND }
        if (request.status !== 'PENDING') return { success: false, error: MESSAGES.GOVERNANCE.FINALIZED }
        if (!request.currentStage) return { success: false, error: "System Error: Request has no current stage" }

        const isNoteWorkflow = ['LOAN_NOTE', 'LOAN_NOTE_PAYMENT', 'LOAN_NOTE_SETTLEMENT'].includes(request.entityType);

        // 2. Permission Check
        const isAuthorized = await checkWorkflowPermission(user, request);
        if (!isAuthorized) {
            return { success: false, error: MESSAGES.AUTH.ACCESS_DENIED }
        }

        // 2.5 Conflict of Interest Check: Self-Approval Block (Standard Loans Only)
        if (request.entityType === 'LOAN' && request.requesterId === user.id) {
            return { success: false, error: MESSAGES.GOVERNANCE.SELF_APPROVAL }
        }

        // 3. Execution
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Double Voting Check
            const existingVote = await tx.workflowAction.findFirst({
                where: {
                    requestId,
                    stageId: request.currentStage!.id,
                    actorId: user.id
                }
            })

            if (existingVote) {
                throw new Error(MESSAGES.GOVERNANCE.ALREADY_VOTED)
            }

            // Log the Action
            await tx.workflowAction.create({
                data: {
                    requestId,
                    stageId: request.currentStage!.id,
                    actorId: user.id,
                    action,
                    notes
                }
            })
            // ... (rest of the transaction logic continues below)
        if (action === 'REJECTED') {
            // Immediate Rejection
            await tx.workflowRequest.update({
                where: { id: requestId },
                data: { status: WorkflowStatus.REJECTED }
            })

            // Trigger rejection callback
            if (request.entityType === 'LOAN') {
                await tx.loan.update({
                    where: { id: request.entityId },
                    data: { status: 'REJECTED' }
                })
            }
        }

        // UNIFICATION: Create a LoanApproval record if this is a loan
        if (request.entityType === 'LOAN') {
            const userWithMember = await tx.user.findUnique({
                where: { id: user.id },
                include: { member: true }
            })

            if (userWithMember?.member) {
                await tx.loanApproval.create({
                    data: {
                        loanId: request.entityId,
                        approverId: userWithMember.member.id,
                        decision: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
                        notes: notes || `Action via workflow stage: ${request.currentStage?.name}`,
                        version: request.version || 1
                    }
                })
            }
        }

        if (action === 'APPROVED') {
            await evaluateAndAdvance(tx, request.id);
        }
    })

    revalidatePath('/dashboard/approvals')
    revalidatePath(`/loans/${request.entityId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Workflow Engine Error:", error);
    return { success: false, error: error.message || "An unexpected workflow error occurred" }
  }
}

/**
 * Internal helper to check governance and move workflow forward.
 * Can be called by processWorkflowAction OR by the manual Sync utility.
 */
async function evaluateAndAdvance(tx: Prisma.TransactionClient, requestId: string) {
    const request = await tx.workflowRequest.findUnique({
        where: { id: requestId },
        include: {
            currentStage: true,
            workflow: { include: { stages: { orderBy: { stepNumber: 'asc' } } } },
            actions: {
                where: { action: 'APPROVED' },
                include: { actor: { select: { id: true, role: true, permissions: true } } }
            }
        }
    })

    if (!request || !request.currentStage || request.status !== 'PENDING') return;

    // 1. Filter Eligible Approvals (Those with permission)
    const requiredPerms = ENTITY_PERMISSION_MAP[request.entityType] || ['ALL'];
    
    const eligibleApprovals = request.actions.filter(a => {
        const perms = a.actor.permissions as any;
        if (!perms) return false;
        
        // System Admin bypass
        if (a.actor.role === 'SYSTEM_ADMIN') return true;

        if (Array.isArray(perms)) {
            return perms.includes('ALL') || requiredPerms.some(p => perms.includes(p));
        }
        if (typeof perms === 'object') {
            return perms['ALL'] === true || requiredPerms.some(p => perms[p] === true);
        }
        return false;
    });

    const effectiveApprovalCount = eligibleApprovals.length;
    const minVotes = request.currentStage.minVotesRequired || 1

    // 2. Check for Privileged Role
    const hasPrivilegedRole = eligibleApprovals.some(a => PRIVILEGED_ROLES.includes(a.actor.role));

    // 3. Final Decision Logic
    const quorumMet = effectiveApprovalCount >= minVotes;
    
    // BOTH Loans AND Notes now require at least one Privileged Role for finalization
    const canFinalize = quorumMet && hasPrivilegedRole;

    if (canFinalize) {
        // THRESHOLD MET: Move to Next Stage
        const currentStep = request.currentStage.stepNumber
        const allStages = request.workflow.stages 

        const nextStage = allStages.find((s: any) => s.stepNumber > currentStep)

        if (nextStage) {
            await tx.workflowRequest.update({
                where: { id: requestId },
                data: { currentStageId: nextStage.id }
            })
        } else {
            // No next stage -> Workflow Complete
            await tx.workflowRequest.update({
                where: { id: requestId },
                data: { status: WorkflowStatus.APPROVED, currentStageId: null }
            })

            // Trigger Completion Logic
            if (request.entityType === 'LOAN') {
                await tx.loan.update({
                    where: { id: request.entityId },
                    data: { status: 'APPROVED' }
                })
            } else if (request.entityType === 'MEMBER') {
                await tx.member.update({
                    where: { id: request.entityId },
                    data: { status: 'ACTIVE' }
                })
            } else if (request.entityType as any === 'LOAN_NOTE') {
                await tx.loanNote.update({
                    where: { id: request.entityId },
                    data: { status: 'OPEN' as any }
                })
            } else if (request.entityType as any === 'LOAN_NOTE_PAYMENT' || (request.entityType as any) === 'LOAN_NOTE_SETTLEMENT') {
                const schedule = await tx.loanNotePaymentSchedule.findUnique({ where: { id: request.entityId } });
                if (schedule) {
                    await tx.loanNotePaymentSchedule.update({
                        where: { id: request.entityId },
                        data: { status: 'AWAITING_CONFIRMATION' }
                    });
                }
            } else if (request.entityType === 'EXPENSE') {
                const { finalizeExpense } = await import('@/app/actions/expenses')
                await finalizeExpense(request.entityId, tx)
            }
        }
    }
}

/**
 * ADMIN UTILITY: Manually trigger re-evaluation of a workflow.
 * Useful when a request is "stuck" despite meeting governance rules.
 */
export async function syncWorkflowRequest(requestId: string) {
    const session = await auth()
    if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)) {
        return { success: false, error: MESSAGES.AUTH.UNAUTHORIZED }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await evaluateAndAdvance(tx, requestId);
        });
        revalidatePath('/admin/workflows');
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Get pending Actions for current user
 */
export async function getPendingWorkflowActions() {
    const session = await auth()
    if (!session?.user) return []

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return []


    // Note: Prisma doesn't support advanced filtering on related fields in `findMany` easily for "My Role OR Admin",
    // We fetch checks.

    // Optimization: If System Admin, fetch ALL pending.
    // If specific role, fetch pending where stage role matches.

    let whereCondition: any = {
        status: WorkflowStatus.PENDING
    }

    if (user.role !== 'SYSTEM_ADMIN') {
        whereCondition.currentStage = {
            requiredRole: user.role
        }
    }

    const requests = await prisma.workflowRequest.findMany({
        where: whereCondition,
        include: {
            workflow: { select: { name: true } },
            currentStage: { select: { name: true, stepNumber: true } },
            requester: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return requests
}

// ADMIN: Seed/Create Workflow
export async function createDefaultLoanWorkflow() {
    // Check if exists
    const existing = await prisma.workflowDefinition.findUnique({ where: { entityType: EntityType.LOAN } })
    if (existing) return existing

    const settings = await prisma.saccoSettings.findFirst()
    const requiredVotes = settings?.requiredApprovals || 1

    const wf = await prisma.workflowDefinition.create({
        data: {
            entityType: EntityType.LOAN,
            name: "Standard Loan Approval",
            description: "Default loan approval process requiring authorized signature",
            stages: {
                create: [
                    {
                        stepNumber: 1,
                        name: "Committee Approval",
                        requiredRole: 'TREASURER', // Primary role, but checkWorkflowPermission allows Chair/Sec too
                        minVotesRequired: requiredVotes,
                        isFinal: true
                    }
                ]
            }
        }
    })
    return wf
}

export async function createDefaultMemberWorkflow() {
    const existing = await prisma.workflowDefinition.findUnique({ where: { entityType: EntityType.MEMBER } })
    if (existing) return existing

    const wf = await prisma.workflowDefinition.create({
        data: {
            entityType: EntityType.MEMBER,
            name: "New Member Registration",
            description: "Standard member onboarding approval",
            stages: {
                create: [
                    { stepNumber: 1, name: "Data Clerk Review", requiredRole: 'SECRETARY' },
                    { stepNumber: 2, name: "Membership Committee", requiredRole: 'CHAIRPERSON', isFinal: true }
                ]
            }
        }
    })
    return wf
}

export async function createDefaultExpenseWorkflow() {
    const existing = await prisma.workflowDefinition.findUnique({ where: { entityType: EntityType.EXPENSE } })
    if (existing) return existing

    const wf = await prisma.workflowDefinition.create({
        data: {
            entityType: EntityType.EXPENSE,
            name: "Expense Request Approval",
            description: "Standard expense approval process (Treasurer -> Chairperson)",
            stages: {
                create: [
                    { stepNumber: 1, name: "Treasurer Review", requiredRole: 'TREASURER' },
                    { stepNumber: 2, name: "Chairperson Approval", requiredRole: 'CHAIRPERSON', isFinal: true }
                ]
            }
        }
    })
    return wf
}
