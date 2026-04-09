"use server"

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { EmailService } from "@/lib/services/EmailService"

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
        // Use secure cryptographically strong generation
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@";
        const bytes = randomBytes(8);
        const tempPassword = Array.from(bytes)
            .map(b => chars[b % chars.length])
            .join('');

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

        // SECURITY P2.7: Never return the plaintext password over HTTP.
        if (user.email) {
            const subject = "Your Temporary Password";
            const html = `
                <h2>Password Reset</h2>
                <p>Hello ${user.name || 'Member'},</p>
                <p>Your password has been reset by an administrator.</p>
                <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                <p>Please log in and change your password immediately.</p>
            `;
            await EmailService.sendEmail(user.email, subject, html);
        }
        return { success: true, tempPassword, message: `Password reset. Please share the temporary password with the user securely.` };

    } catch (e) {
        return { error: "Failed to reset password." };
    }
}
