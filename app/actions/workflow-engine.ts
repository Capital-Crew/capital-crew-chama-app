'use server'

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import { EntityType, ApprovalAction, WorkflowStatus, UserRole, Prisma } from "@prisma/client" // Ensure these are exported from generated client once migrated
import { revalidatePath } from "next/cache"

// Helper to check role hierarchy or specific permission
// For now, simple Role check
function hasRole(userRole: string, requiredRole: string) {
    if (userRole === 'SYSTEM_ADMIN') return true
    if (userRole === requiredRole) return true
    return false
}

/**
 * Initiate a workflow for a new Entity (e.g. Loan Application)
 */
export async function initiateWorkflow(entityType: EntityType, entityId: string, requesterId: string) {
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

    // 2. Create the Request
    const request = await prisma.workflowRequest.create({
        data: {
            workflowId: definition.id,
            currentStageId: firstStage.id,
            entityType,
            entityId,
            requesterId,
            status: WorkflowStatus.PENDING
        }
    })

    return request
}

/**
 * Process an action on a workflow request (Approve/Reject)
 */
export async function processWorkflowAction(requestId: string, action: ApprovalAction, notes?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) throw new Error("User not found")

    // 1. Fetch Request with Current Stage info
    const request = await prisma.workflowRequest.findUnique({
        where: { id: requestId },
        include: {
            currentStage: true,
            workflow: { include: { stages: { orderBy: { stepNumber: 'asc' } } } }
        }
    })

    if (!request) throw new Error("Request not found")
    if (request.status !== 'PENDING') throw new Error("Request is already finalized")
    if (!request.currentStage) throw new Error("System Error: Request has no current stage")

    // 2. Permission Check
    // Does user have the required role for this stage?
    if (!hasRole(user.role, request.currentStage.requiredRole)) {
        throw new Error(`Unauthorized: You need to be a ${request.currentStage.requiredRole} to perform this action.`)
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
            throw new Error("You have already voted on this stage.")
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

        } else if (action === 'APPROVED') {
            // CHECK VOTES
            const approvalCount = await tx.workflowAction.count({
                where: {
                    requestId,
                    stageId: request.currentStage!.id,
                    action: 'APPROVED'
                }
            })

            const minVotes = request.currentStage!.minVotesRequired || 1

            if (approvalCount >= minVotes) {
                // THRESHOLD MET: Move to Next Stage
                const currentStep = request.currentStage!.stepNumber
                const allStages = request.workflow.stages // Ordered asc

                const nextStage = allStages.find((s: any) => s.stepNumber > currentStep)

                if (nextStage) {
                    // Advance
                    await tx.workflowRequest.update({
                        where: { id: requestId },
                        data: { currentStageId: nextStage.id }
                    })
                } else {
                    // No next stage -> Workflow Complete
                    await tx.workflowRequest.update({
                        where: { id: requestId },
                        data: {
                            status: WorkflowStatus.APPROVED,
                            currentStageId: null
                        }
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
                    } else if (request.entityType === 'EXPENSE') {
                        const { finalizeExpense } = await import('@/app/actions/expenses')
                        await finalizeExpense(request.entityId, tx)
                    }
                }
            }
        }
    })

    revalidatePath('/dashboard/approvals')
    revalidatePath(`/loans/${request.entityId}`)
    return { success: true }
}

/**
 * Get pending Actions for current user
 */
export async function getPendingWorkflowActions() {
    const session = await auth()
    if (!session?.user) return []

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return []

    // Find requests where:
    // 1. Status is PENDING
    // 2. Current Stage requires user's role

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

    const wf = await prisma.workflowDefinition.create({
        data: {
            entityType: EntityType.LOAN,
            name: "Standard Loan Approval",
            description: "Default 3-stage loan approval process",
            stages: {
                create: [
                    { stepNumber: 1, name: "Clerk Review", requiredRole: 'SECRETARY' },
                    { stepNumber: 2, name: "Credit Committee", requiredRole: 'TREASURER', minVotesRequired: 2 }, // Defaulting to 2 for demo purposes
                    { stepNumber: 3, name: "Chairperson Approval", requiredRole: 'CHAIRPERSON', isFinal: true }
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
