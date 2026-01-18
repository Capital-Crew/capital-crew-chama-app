"use server"

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    contact: z.string().min(10, {
        message: "Phone number must be valid.",
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export async function updateProfile(data: ProfileFormValues) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const validated = profileSchema.parse(data);

        // Update User and linked Member
        await db.$transaction(async (tx) => {
            // Update User name
            await tx.user.update({
                where: { id: session.user.id },
                data: { name: validated.name }
            });

            // Update Member details if linked
            const user = await tx.user.findUnique({
                where: { id: session.user.id },
                select: { memberId: true }
            });

            if (user?.memberId) {
                await tx.member.update({
                    where: { id: user.memberId },
                    data: {
                        name: validated.name,
                        contact: validated.contact
                    }
                });
            }
        });

        revalidatePath("/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile" };
    }
}

export async function updateProfileImage(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file provided" };
    }

    try {
        // In a real app, upload to S3/Cloudinary here.
        // For now, valid method is basic Base64 for small images (limit size client side)
        // or just mock it if file handling is restricted.

        // Converting to Base64 for DB storage (Simplest for this environment)
        // Warning: This Bloats DB. Ideal: Upload to blob storage and save URL.

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

        await db.user.update({
            where: { id: session.user.id },
            data: {
                image: base64Image,
                avatarPreset: null // Clear preset when uploading custom image
            }
        });

        revalidatePath("/profile");
        revalidatePath("/", "layout"); // Revalidate layout to update header
        return { success: "Profile picture updated" };
    } catch (error) {
        console.error("Image upload error:", error);
        return { error: "Failed to update profile picture" };
    }
}

/**
 * Update user's avatar preset selection
 */
export async function updateAvatarPreset(presetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: {
                avatarPreset: presetId,
                image: null // Clear custom image when selecting preset
            }
        });

        revalidatePath("/profile");
        revalidatePath("/", "layout"); // Revalidate layout to update header
        return { success: "Avatar updated successfully" };
    } catch (error) {
        console.error("Avatar preset update error:", error);
        return { error: "Failed to update avatar" };
    }
}

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

/**
 * Change user password with validation
 */
export async function changePassword(data: PasswordChangeValues) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const validated = passwordSchema.parse(data);

        // Get current user with password hash
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true }
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
            validated.currentPassword,
            user.passwordHash
        );

        if (!isValidPassword) {
            return { error: "Current password is incorrect" };
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

        // Update password
        await db.user.update({
            where: { id: session.user.id },
            data: {
                passwordHash: newPasswordHash,
                mustChangePassword: false // Clear flag if it was set
            }
        });

        return { success: "Password changed successfully" };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message };
        }
        console.error("Password change error:", error);
        return { error: "Failed to change password" };
    }
}
