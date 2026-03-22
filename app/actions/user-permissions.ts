'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { UserPermissions, UserRole } from '@/lib/types';
import { AuditLogAction } from '@prisma/client';
import { withAudit } from '@/lib/with-audit';


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
    canActivateMember: false,
    canManageLedger: false,
    canViewReportLoanDisbursement: false,
    canViewReportActivePortfolio: false,
    canViewReportPAR: false,
    canViewReportTrialBalance: false,
    canViewReportBalanceSheet: false,
    canViewReportIncomeStatement: false,
    canViewReportCashFlow: false,
    canViewReportProductProfitability: false,
    canViewReportFeeAnalysis: false,
    canViewReportNetInterestMargin: false
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
        canActivateMember: z.boolean().optional().default(false),
        canManageLedger: z.boolean().optional().default(false),
        canViewReportLoanDisbursement: z.boolean().optional().default(false),
        canViewReportActivePortfolio: z.boolean().optional().default(false),
        canViewReportPAR: z.boolean().optional().default(false),
        canViewReportTrialBalance: z.boolean().optional().default(false),
        canViewReportBalanceSheet: z.boolean().optional().default(false),
        canViewReportIncomeStatement: z.boolean().optional().default(false),
        canViewReportCashFlow: z.boolean().optional().default(false),
        canViewReportProductProfitability: z.boolean().optional().default(false),
        canViewReportFeeAnalysis: z.boolean().optional().default(false),
        canViewReportNetInterestMargin: z.boolean().optional().default(false)
    })
});


/**
 * Update user permissions
 */
export const updateUserPermissions = withAudit(
    { actionType: AuditLogAction.USER_RIGHTS_UPDATED, domain: 'SECURITY', apiRoute: '/api/admin/permissions/update' },
    async (ctx, input: {
        userId: string;
        permissions: UserPermissions;
    }) => {
        try {
            ctx.beginStep('Verify Authorization');
            const session = await auth();
            if (!session?.user?.id) {
                ctx.setErrorCode('UNAUTHORIZED');
                throw new Error('Unauthorized');
            }

            const currentUser = await db.user.findUnique({
                where: { id: session.user.id },
                select: { role: true, permissions: true }
            });

            if (!currentUser) {
                ctx.setErrorCode('USER_NOT_FOUND');
                throw new Error('User not found');
            }

            const hasPermission =
                currentUser.role === 'SYSTEM_ADMIN' ||
                currentUser.role === 'CHAIRPERSON' ||
                (currentUser.permissions as unknown as UserPermissions)?.canManageUserRights;

            if (!hasPermission) {
                ctx.setErrorCode('FORBIDDEN');
                throw new Error('You do not have permission to manage user rights');
            }

            const validated = UpdatePermissionsSchema.parse(input);
            if (validated.userId === session.user.id) {
                ctx.setErrorCode('SELF_MODIFICATION_RESTRICTED');
                throw new Error('Security Error: You cannot modify your own permissions. Contact another administrator.');
            }
            ctx.endStep('Verify Authorization');

            ctx.beginStep('Capture Initial State');
            const targetUser = await db.user.findUnique({
                where: { id: validated.userId },
                select: { id: true, email: true, role: true, permissions: true }
            });
            if (targetUser) ctx.captureBefore('User', validated.userId, targetUser);
            ctx.endStep('Capture Initial State');

            ctx.beginStep('Update Database');
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
            ctx.captureAfter(updatedUser);
            ctx.endStep('Update Database');

            revalidatePath('/admin/system');
            revalidatePath('/dashboard');

            return {
                success: true,
                message: 'Permissions updated successfully',
                user: updatedUser
            };

        } catch (error) {
            ctx.setErrorCode('PERMISSION_UPDATE_FAILED');
            if (error instanceof z.ZodError) {
                const checklist = error.issues || [];
                const message = checklist.length > 0
                    ? `${checklist[0].path.join('.')}: ${checklist[0].message}`
                    : 'Invalid Usage (Empty Error List)';
                throw new Error(`Validation error: ${message}`);
            }
            throw error;
        }
    }
);

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
        throw new Error('Failed to fetch users');
    }
}

/**
 * Update user role
 */
export const updateUserRole = withAudit(
    { actionType: AuditLogAction.USER_RIGHTS_UPDATED, domain: 'SECURITY', apiRoute: '/api/admin/role/update' },
    async (ctx, userId: string, role: UserRole) => {
        try {
            ctx.beginStep('Verify Authorization');
            const session = await auth();
            if (!session?.user?.id) {
                ctx.setErrorCode('UNAUTHORIZED');
                throw new Error('Unauthorized');
            }

            const currentUser = await db.user.findUnique({
                where: { id: session.user.id },
                select: { role: true }
            });

            if (currentUser?.role !== 'CHAIRPERSON') {
                ctx.setErrorCode('FORBIDDEN');
                throw new Error('Only the Chairperson can update user roles');
            }

            if (userId === session.user.id) {
                ctx.setErrorCode('SELF_MODIFICATION_RESTRICTED');
                throw new Error('Security Error: You cannot modify your own role. Contact another administrator.');
            }

            if (role === 'CHAIRPERSON' && currentUser.role !== 'CHAIRPERSON') {
                ctx.setErrorCode('FORBIDDEN_GRANT');
                throw new Error('Only the Chairperson can grant the Chairperson role to others');
            }
            ctx.endStep('Verify Authorization');

            ctx.beginStep('Capture Initial State');
            const targetUser = await db.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true }
            });
            if (targetUser) ctx.captureBefore('User', userId, targetUser);
            ctx.endStep('Capture Initial State');

            ctx.beginStep('Update Database');
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
            ctx.captureAfter(updatedUser);
            ctx.endStep('Update Database');

            revalidatePath('/admin/system');

            return {
                success: true,
                message: 'Role updated successfully'
            };

        } catch (error) {
            ctx.setErrorCode('ROLE_UPDATE_FAILED');
            throw error instanceof Error ? error : new Error('Failed to update role');
        }
    }
);

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
                canActivateMember: false,
                canManageLedger: false,
                canViewReportLoanDisbursement: false,
                canViewReportActivePortfolio: false,
                canViewReportPAR: false,
                canViewReportTrialBalance: false,
                canViewReportBalanceSheet: false,
                canViewReportIncomeStatement: false,
                canViewReportCashFlow: false,
                canViewReportProductProfitability: false,
                canViewReportFeeAnalysis: false,
                canViewReportNetInterestMargin: false
            }
        };
    } catch (error) {
        return null;
    }
}
