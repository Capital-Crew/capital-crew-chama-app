"use server"

import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export async function changePassword(data: ChangePasswordValues) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validated = changePasswordSchema.safeParse(data);
    if (!validated.success) {
        return { error: validated.error.issues[0].message };
    }

    const { currentPassword, newPassword } = validated.data;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) return { error: "User not found" };

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!passwordMatch) {
            return { error: "Incorrect current password" };
        }

        // Check if new password is same as old?
        // Optional security rule, but good practice.
        const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
        if (sameAsOld) {
            return { error: "New password cannot be the same as the old one." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                passwordHash: hashedPassword,
                mustChangePassword: false // Clear the flag
            }
        });

        revalidatePath("/dashboard");
        return { success: "Password changed successfully." };

    } catch (e) {
        return { error: "Failed to change password." };
    }
}
