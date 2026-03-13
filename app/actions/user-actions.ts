'use server'

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import { AuditLogAction } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { withAudit } from "@/lib/with-audit"

const assignUsernameSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username too long").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    // Optional member number verification if passed
    memberNumber: z.number().optional()
})

/**
 * Assigns a username with "Integrity Guard" Checks
 * Ensures User has a valid Member and Wallet BEFORE allowing assignment.
 */
export const assignUsername = withAudit(
    { actionType: AuditLogAction.USER_RIGHTS_UPDATED, domain: 'SECURITY', apiRoute: '/api/admin/assign-username' },
    async (ctx, formData: FormData) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()

        // 0. Authorization
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        // Check if admin
        const actor = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (actor?.role !== 'SYSTEM_ADMIN' && actor?.role !== 'CHAIRPERSON' && actor?.role !== 'SECRETARY') {
            ctx.setErrorCode('FORBIDDEN');
            return { success: false, error: "Unauthorized: Insufficient permissions" }
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Validate Input');
        const rawData = {
            userId: formData.get('userId'),
            username: formData.get('username'),
            memberNumber: formData.get('memberNumber') ? Number(formData.get('memberNumber')) : undefined
        }

        const validated = assignUsernameSchema.safeParse(rawData)
        if (!validated.success) {
            ctx.setErrorCode('INVALID_INPUT');
            return { success: false, error: validated.error.issues[0].message }
        }

        const { userId, username, memberNumber } = validated.data
        ctx.endStep('Validate Input');

        try {
            ctx.beginStep('Fetch Target User and Integrity Checks');
            // 1. Fetch User with Member and Wallet
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    member: {
                        include: {
                            wallet: true
                        }
                    }
                }
            })

            if (!targetUser) {
                ctx.setErrorCode('USER_NOT_FOUND');
                return { success: false, error: "User not found" }
            }
            ctx.captureBefore('User', userId, targetUser);

            // 2. INTEGRITY GUARD CHECKS
            if (!targetUser.member) {
                ctx.setErrorCode('INTEGRITY_MEMBER_MISSING');
                return { success: false, error: "Integrity Error: User is not linked to any Member record." }
            }

            if (!targetUser.member.wallet) {
                ctx.setErrorCode('INTEGRITY_WALLET_MISSING');
                return { success: false, error: "Critical Integrity Error: Member has no linked Wallet." }
            }

            if (memberNumber !== undefined && targetUser.member.memberNumber !== memberNumber) {
                ctx.setErrorCode('MEMBER_NUMBER_MISMATCH');
                return { success: false, error: `Member Number Mismatch. Expected ${targetUser.member.memberNumber}, got ${memberNumber}.` }
            }
            ctx.endStep('Fetch Target User and Integrity Checks');

            ctx.beginStep('Update Username');
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { name: username }
            })
            ctx.captureAfter(updatedUser);
            ctx.endStep('Update Username');

            revalidatePath('/admin/system')
            return { success: true }

        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            return { success: false, error: "Database error occurred." }
        }
    }
);
