"use server"

import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { withAudit } from "@/lib/with-audit"
import { AuditLogAction } from "@prisma/client"

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const changePassword = withAudit(
    { actionType: AuditLogAction.USER_RIGHTS_UPDATED, domain: 'SECURITY', apiRoute: '/api/settings/auth/change-password' },
    async (ctx, data: ChangePasswordValues) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: "Unauthorized" };
        }

        const validated = changePasswordSchema.safeParse(data);
        if (!validated.success) {
            ctx.setErrorCode('VALIDATION_ERROR');
            return { error: validated.error.issues[0].message };
        }

        const { currentPassword, newPassword } = validated.data;

        try {
            ctx.beginStep('Verify Current Password');
            const user = await prisma.user.findUnique({
                where: { id: session.user.id }
            });

            if (!user) {
                ctx.setErrorCode('USER_NOT_FOUND');
                return { error: "User not found" };
            }

            // Verify current password
            const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!passwordMatch) {
                ctx.setErrorCode('INVALID_CURRENT_PASSWORD');
                return { error: "Incorrect current password" };
            }

            // Check if new password is same as old
            const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
            if (sameAsOld) {
                ctx.setErrorCode('SAME_AS_OLD_PASSWORD');
                return { error: "New password cannot be the same as the old one." };
            }
            ctx.endStep('Verify Current Password');

            ctx.beginStep('Execute Password Change');
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    passwordHash: hashedPassword,
                    mustChangePassword: false
                }
            });
            ctx.endStep('Execute Password Change');

            revalidatePath("/dashboard");
            return { success: "Password changed successfully." };

        } catch (e) {
            ctx.setErrorCode('PASSWORD_CHANGE_FAILED');
            return { error: "Failed to change password." };
        }
    }
);
