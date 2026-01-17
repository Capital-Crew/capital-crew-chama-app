'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db' // Assuming db is the prisma instance
import { UserRole } from '@prisma/client'

/**
 * Validates access and fetches members based on RBAC rules.
 * 
 * Privileged Roles: TREASURER, SECRETARY, CHAIRPERSON, SYSTEM_ADMIN
 * Restricted Roles: MEMBER (Can only view self)
 */
export async function getMembers() {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { role, memberId } = session.user as { role: UserRole, memberId?: string };

    const privilegedRoles = [
        UserRole.SYSTEM_ADMIN,
        UserRole.CHAIRPERSON,
        UserRole.TREASURER,
        UserRole.SECRETARY
    ];

    const isPrivileged = privilegedRoles.includes(role);

    // Filter Logic
    const whereClause = isPrivileged
        ? {} // No filter
        : { id: memberId }; // Strict filter to own ID

    // Security Check: If restricted and no memberId, return empty or throw
    if (!isPrivileged && !memberId) {
        return [];
    }

    const members = await db.member.findMany({
        where: whereClause,
        orderBy: { memberNumber: 'asc' },
        select: {
            id: true,
            name: true,
            memberNumber: true,
            status: true, // Useful for UI
            contact: true,
            // Add other fields typically needed for the list view
        }
    });

    return members;
}
