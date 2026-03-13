"use server"

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { withAudit } from "@/lib/with-audit";
import { AuditLogAction } from "@prisma/client";

const profileSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    contact: z.string().min(10, {
        message: "Phone number must be valid.",
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const updateProfile = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'MEMBERSHIP', apiRoute: '/api/settings/profile' },
    async (ctx, data: ProfileFormValues) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: "Unauthorized" };
        }

        ctx.beginStep('Capture Initial State');
        const userWithMember = await db.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        });
        if (userWithMember) {
            ctx.captureBefore('User', session.user.id, userWithMember);
        }

        try {
            ctx.beginStep('Validate Input');
            const validated = profileSchema.parse(data);
            ctx.endStep('Validate Input');

            ctx.beginStep('Execute Database Update');
            await db.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: { name: validated.name }
                });

                if (userWithMember?.memberId) {
                    await tx.member.update({
                        where: { id: userWithMember.memberId },
                        data: {
                            name: validated.name,
                            contact: validated.contact
                        }
                    });
                }
            });

            const updatedUser = await db.user.findUnique({
                where: { id: session.user.id },
                include: { member: true }
            });
            if (updatedUser) ctx.captureAfter(updatedUser);
            ctx.endStep('Execute Database Update');

            revalidatePath("/profile");
            return { success: "Profile updated successfully" };
        } catch (error) {
            ctx.setErrorCode('UPDATE_FAILED');
            return { error: "Failed to update profile" };
        }
    }
);

export const updateProfileImage = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'MEMBERSHIP', apiRoute: '/api/settings/profile-image' },
    async (ctx, formData: FormData) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: "Unauthorized" };
        }

        const file = formData.get("file") as File;
        if (!file) {
            ctx.setErrorCode('MISSING_FILE');
            return { error: "No file provided" };
        }

        try {
            ctx.beginStep('Process Image');
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
            ctx.endStep('Process Image');

            ctx.beginStep('Update Database');
            await db.user.update({
                where: { id: session.user.id },
                data: {
                    image: base64Image,
                    avatarPreset: null
                }
            });
            ctx.endStep('Update Database');

            revalidatePath("/profile");
            revalidatePath("/", "layout");
            return { success: "Profile picture updated" };
        } catch (error) {
            ctx.setErrorCode('IMAGE_UPDATE_FAILED');
            return { error: "Failed to update profile picture" };
        }
    }
);

export const updateAvatarPreset = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'MEMBERSHIP', apiRoute: '/api/settings/avatar-preset' },
    async (ctx, presetId: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: "Unauthorized" };
        }

        try {
            ctx.beginStep('Update Database');
            await db.user.update({
                where: { id: session.user.id },
                data: {
                    avatarPreset: presetId,
                    image: null
                }
            });
            ctx.endStep('Update Database');

            revalidatePath("/profile");
            revalidatePath("/", "layout");
            return { success: "Avatar updated successfully" };
        } catch (error) {
            ctx.setErrorCode('PRESET_UPDATE_FAILED');
            return { error: "Failed to update avatar" };
        }
    }
);

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type PasswordChangeValues = z.infer<typeof passwordSchema>;

export const changePassword = withAudit(
    { actionType: AuditLogAction.USER_RIGHTS_UPDATED, domain: 'SECURITY', apiRoute: '/api/settings/change-password' },
    async (ctx, data: PasswordChangeValues) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: "Unauthorized" };
        }

        try {
            ctx.beginStep('Validate Input');
            const validated = passwordSchema.parse(data);
            ctx.endStep('Validate Input');

            ctx.beginStep('Verify Current Password');
            const user = await db.user.findUnique({
                where: { id: session.user.id },
                select: { passwordHash: true }
            });

            if (!user) {
                ctx.setErrorCode('USER_NOT_FOUND');
                return { error: "User not found" };
            }

            const isValidPassword = await bcrypt.compare(
                validated.currentPassword,
                user.passwordHash
            );

            if (!isValidPassword) {
                ctx.setErrorCode('INVALID_CURRENT_PASSWORD');
                return { error: "Current password is incorrect" };
            }
            ctx.endStep('Verify Current Password');

            ctx.beginStep('Execute Password Change');
            const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

            await db.user.update({
                where: { id: session.user.id },
                data: {
                    passwordHash: newPasswordHash,
                    mustChangePassword: false
                }
            });
            ctx.endStep('Execute Password Change');

            return { success: "Password changed successfully" };
        } catch (error) {
            if (error instanceof z.ZodError) {
                ctx.setErrorCode('VALIDATION_ERROR');
                return { error: error.issues[0].message };
            }
            ctx.setErrorCode('PASSWORD_CHANGE_FAILED');
            return { error: "Failed to change password" };
        }
    }
);
