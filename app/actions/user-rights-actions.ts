'use server'

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import { AuditLogAction, UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { withAudit } from "@/lib/with-audit"

export const updateUserRights = withAudit(
    { actionType: AuditLogAction.USER_RIGHTS_UPDATED, domain: 'SECURITY', apiRoute: '/api/admin/rights/update' },
    async (ctx, targetUserId: string, newRole: UserRole) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        const currentUser = await prisma.user.findUnique({
            where: { id: session?.user?.id },
            select: { id: true, name: true, role: true }
        })

        if (currentUser?.role !== 'SYSTEM_ADMIN') {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized: Only System Administrators can manage user rights." }
        }

        if (targetUserId === currentUser.id) {
            ctx.setErrorCode('SELF_MODIFICATION_RESTRICTED');
            return { success: false, error: "Operation Denied: You cannot modify your own access rights." }
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Capture Initial State');
            const targetUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true, name: true, role: true }
            })

            if (!targetUser) {
                ctx.setErrorCode('USER_NOT_FOUND');
                return { success: false, error: "User not found" }
            }
            ctx.captureBefore('User', targetUserId, targetUser);
            ctx.endStep('Capture Initial State');

            ctx.beginStep('Update Database');
            const updatedUser = await prisma.user.update({
                where: { id: targetUserId },
                data: { role: newRole }
            })
            ctx.captureAfter(updatedUser);
            ctx.endStep('Update Database');

            revalidatePath('/admin/system')
            return { success: true }
        } catch (error) {
            ctx.setErrorCode('UPDATE_FAILED');
            return { success: false, error: "Database error occurred" }
        }
    }
);
