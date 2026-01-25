'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { EntityType } from '@prisma/client'

/**
 * Create a new approval delegation
 */
export async function delegateApproval(
    toUserId: string,
    entityType?: EntityType,
    entityId?: string,
    expiresAt?: Date
) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const fromUserId = session.user.id

    // Validation
    if (fromUserId === toUserId) {
        return { error: 'Cannot delegate to yourself' }
    }

    // Check if toUser exists
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } })
    if (!toUser) {
        return { error: 'Delegatee user not found' }
    }

    // Check for existing active delegation
    const existing = await prisma.approvalDelegation.findFirst({
        where: {
            fromUserId,
            toUserId,
            entityType: entityType || null,
            entityId: entityId || null,
            revokedAt: null,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }
    })

    if (existing) {
        return { error: 'An active delegation already exists for this user and entity' }
    }

    // Create delegation
    const delegation = await prisma.approvalDelegation.create({
        data: {
            fromUserId,
            toUserId,
            entityType,
            entityId,
            expiresAt
        },
        include: {
            toUser: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    })

    revalidatePath('/approvals')
    revalidatePath('/loans')

    return { success: true, delegation }
}

/**
 * Revoke an existing delegation
 */
export async function revokeDelegation(delegationId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const delegation = await prisma.approvalDelegation.findUnique({
        where: { id: delegationId }
    })

    if (!delegation) {
        return { error: 'Delegation not found' }
    }

    // Only the delegator can revoke
    if (delegation.fromUserId !== session.user.id) {
        return { error: 'You can only revoke your own delegations' }
    }

    if (delegation.revokedAt) {
        return { error: 'Delegation already revoked' }
    }

    await prisma.approvalDelegation.update({
        where: { id: delegationId },
        data: { revokedAt: new Date() }
    })

    revalidatePath('/approvals')
    revalidatePath('/loans')

    return { success: true }
}

/**
 * Get all active delegations for the current user (both from and to)
 */
export async function getMyDelegations() {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const userId = session.user.id

    const [delegatedFrom, delegatedTo] = await Promise.all([
        // Delegations I've given to others
        prisma.approvalDelegation.findMany({
            where: {
                fromUserId: userId,
                revokedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                toUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        // Delegations I've received from others
        prisma.approvalDelegation.findMany({
            where: {
                toUserId: userId,
                revokedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    ])

    return {
        delegatedFrom,
        delegatedTo
    }
}

/**
 * Check if a user can approve on behalf of another user
 * Used in approval workflow to validate delegated approvals
 */
export async function canApproveOnBehalfOf(
    userId: string,
    entityType: EntityType,
    entityId: string
): Promise<boolean> {
    const session = await auth()
    if (!session?.user?.id) return false

    const actingUserId = session.user.id

    // User can always approve as themselves
    if (actingUserId === userId) return true

    // Check for active delegation
    const delegation = await prisma.approvalDelegation.findFirst({
        where: {
            fromUserId: userId,
            toUserId: actingUserId,
            revokedAt: null,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ],
            AND: [
                {
                    OR: [
                        { entityType: null },
                        { entityType }
                    ]
                },
                {
                    OR: [
                        { entityId: null },
                        { entityId }
                    ]
                }
            ]
        }
    })

    return !!delegation
}

/**
 * Get all users who can approve (for delegation dropdown)
 */
export async function getApprovers() {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    // Get users with approval permissions
    const approvers = await prisma.user.findMany({
        where: {
            OR: [
                { role: { in: ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'] } },
                // Add granular permission check if needed
            ]
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        },
        orderBy: { name: 'asc' }
    })

    return approvers
}
