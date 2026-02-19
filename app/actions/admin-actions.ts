"use server"

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function resetUserPassword(inputId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    // Permission Check
    // Allowed: SYSTEM_ADMIN, CHAIRPERSON, SECRETARY
    const allowedRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'SECRETARY'];
    if (!allowedRoles.includes(session.user.role)) {
        return { error: "Insufficient permissions to reset passwords." };
    }

    try {
        // Try finding by User ID first, then by Member ID
        let user = await prisma.user.findUnique({ where: { id: inputId } });

        if (!user) {
            // Try lookup by memberId
            user = await prisma.user.findFirst({ where: { memberId: inputId } });
        }

        if (!user) return { error: "User not found" };

        // Generate temporary password
        // Simple random string logic
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@";
        let tempPassword = "";
        for (let i = 0; i < 8; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                mustChangePassword: true
            }
        });

        revalidatePath("/members");
        revalidatePath("/admin/system");

        return { success: true, tempPassword };

    } catch (e) {
        console.error("Reset Password Error:", e);
        return { error: "Failed to reset password." };
    }
}
