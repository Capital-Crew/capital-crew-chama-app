/**
 * User Permissions Management Actions
 * 
 * Server actions for managing user permissions in the settings module.
 */

'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { UserPermissions, UserRole } from '@/lib/types';

// ========================================
// VALIDATION SCHEMAS
// ========================================

// Default permissions object
const defaultPermissions: UserPermissions = {
    canViewAll: false,
    canAddData: false,
    canApprove: false,
    canManageSettings: false,
    canViewReports: false,
    canViewAudit: false,
    canManageUserRights: false,
    canExemptFees: false,
    canReverse: false,
    canEnrollMembers: false,
    canApproveMember: false,
    canActivateMember: false
};

const UpdatePermissionsSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    permissions: z.object({
        canViewAll: z.boolean().optional().default(false),
        canAddData: z.boolean().optional().default(false),
        canApprove: z.boolean().optional().default(false),
        canManageSettings: z.boolean().optional().default(false),
        canViewReports: z.boolean().optional().default(false),
        canViewAudit: z.boolean().optional().default(false),
        canManageUserRights: z.boolean().optional().default(false),
        canExemptFees: z.boolean().optional().default(false),
        canReverse: z.boolean().optional().default(false),
        canEnrollMembers: z.boolean().optional().default(false),
        canApproveMember: z.boolean().optional().default(false),
        canActivateMember: z.boolean().optional().default(false)
    })
});

// ========================================
// ACTIONS
// ========================================

/**
 * Update user permissions
 */
export async function updateUserPermissions(input: {
    userId: string;
    permissions: UserPermissions;
}) {
    try {
        // 1. Authenticate
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error('Unauthorized');
        }

        // 2. Check if current user has permission to manage user rights
        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, permissions: true }
        });

        if (!currentUser) {
            throw new Error('User not found');
        }

        // Only CHAIRPERSON or users with canManageUserRights can update permissions
        const hasPermission =
            currentUser.role === 'CHAIRPERSON' ||
            (currentUser.permissions as unknown as UserPermissions)?.canManageUserRights;

        if (!hasPermission) {
            throw new Error('You do not have permission to manage user rights');
        }

        // 3. Validate input
        const validated = UpdatePermissionsSchema.parse(input);

        // 4. Update user permissions
        const updatedUser = await db.user.update({
            where: { id: validated.userId },
            data: {
                permissions: validated.permissions as any
            },
            include: {
                member: {
                    select: {
                        name: true,
                        memberNumber: true
                    }
                }
            }
        });

        // 5. Create audit log
        await db.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'USER_RIGHTS_UPDATED',
                details: `Updated permissions for ${updatedUser.member?.name || updatedUser.email}: ${JSON.stringify(validated.permissions)}`
            }
        });

        // 6. Revalidate paths
        revalidatePath('/admin/system');
        revalidatePath('/dashboard');

        return {
            success: true,
            message: 'Permissions updated successfully',
            user: updatedUser
        };

    } catch (error) {
        console.error('Update permissions error:', error);

        if (error instanceof z.ZodError) {
            const zodError = error as z.ZodError;
            console.error('Zod Error Details:', JSON.stringify(zodError.issues, null, 2));
            const checklist = zodError.issues || [];
            const message = checklist.length > 0
                ? `${checklist[0].path.join('.')}: ${checklist[0].message}`
                : 'Invalid Usage (Empty Error List)';

            // For debugging, returning the whole list
            throw new Error(`Validation error: ${message}`);
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new Error('Failed to update permissions');
    }
}

/**
 * Get all users with their permissions
 */
export async function getAllUsersWithPermissions() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error('Unauthorized');
        }

        const users = await db.user.findMany({
            include: {
                member: {
                    select: {
                        name: true,
                        memberNumber: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.member?.name || user.name,
            memberNumber: user.member?.memberNumber,
            role: user.role,
            permissions: { ...defaultPermissions, ...(user.permissions as any || {}) }
        }));

    } catch (error) {
        console.error('Get users error:', error);
        throw new Error('Failed to fetch users');
    }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: UserRole) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error('Unauthorized');
        }

        // Only CHAIRPERSON can update roles
        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (currentUser?.role !== 'CHAIRPERSON') {
            throw new Error('Only the Chairperson can update user roles');
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { role },
            include: {
                member: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Create audit log
        await db.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'USER_RIGHTS_UPDATED',
                details: `Updated role for ${updatedUser.member?.name || updatedUser.email} to ${role}`
            }
        });

        revalidatePath('/admin/system');

        return {
            success: true,
            message: 'Role updated successfully'
        };

    } catch (error) {
        console.error('Update role error:', error);
        throw error instanceof Error ? error : new Error('Failed to update role');
    }
}

/**
 * Get current user's role and permissions
 */
export async function getCurrentUserPermissions() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return null;
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                permissions: true
            }
        });

        if (!user) return null;

        return {
            role: user.role,
            permissions: (user.permissions as any as UserPermissions) || {
                canViewAll: false,
                canAddData: false,
                canApprove: false,
                canManageSettings: false,
                canViewReports: false,
                canViewAudit: false,
                canManageUserRights: false,
                canExemptFees: false,
                canReverse: false,
                canEnrollMembers: false,
                canApproveMember: false,
                canActivateMember: false
            }
        };
    } catch (error) {
        console.error('Get current user permissions error:', error);
        return null;
    }
}
