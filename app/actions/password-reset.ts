'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { rateLimiter } from '@/lib/ratelimit';
import { EmailService } from '@/lib/services/EmailService';

/**
 * Zod Schemas for validation
 */
const RequestResetSchema = z.object({
    email: z.string().email("Invalid email address"),
});

const ResetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(10, "Password must be at least 10 characters"),
    confirmPassword: z.string().min(10, "Confirm password must be at least 10 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

/**
 * Action: Request Password Reset
 * Generates a token and logs the reset link (mock email sending)
 */
export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string;

    const { success } = await rateLimiter.limit(email || 'unknown');
    if (!success) {
        return { success: false, error: "Too many attempts. Please wait 15 minutes and try again." };
    }

    const validated = RequestResetSchema.safeParse({ email });
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }

    try {
        // 1. Check if user exists
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            // For security, don't confirm if user exists or not
            return { success: true, message: "If an account exists with that email, a reset link has been sent." };
        }

        // 2. Generate secure token
        const token = uuidv4();
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

        // 3. Save token (delete existing ones first for this email)
        await db.passwordResetToken.deleteMany({
            where: { email }
        });

        await db.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        });

        // 4. Emaill delivery via nodemailer
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

        const subject = "Password Reset Request";
        const html = `
            <h2>Password Reset</h2>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        await EmailService.sendEmail(email, subject, html);

        return { success: true, message: "If an account exists with that email, a reset link has been sent." };

    } catch (error) {
        return { success: false, error: "Failed to process request. Please try again later." };
    }
}

/**
 * Action: Reset Password
 * Validates token and updates user password
 */
export async function resetPassword(formData: FormData) {
    const token = formData.get('token') as string;

    const { success } = await rateLimiter.limit(token || 'unknown');
    if (!success) {
        return { success: false, error: "Too many attempts. Please wait 15 minutes and try again." };
    }

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const validated = ResetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }

    try {
        // 1. Find and validate token
        const resetToken = await db.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.expires < new Date()) {
            return { success: false, error: "Invalid or expired token. Please request a new reset link." };
        }

        // 2. Find user
        const user = await db.user.findUnique({
            where: { email: resetToken.email }
        });

        if (!user) {
            return { success: false, error: "User associated with this token no longer exists." };
        }

        // 3. Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Update user in transaction
        await db.$transaction([
            db.user.update({
                where: { id: user.id },
                data: { passwordHash }
            }),
            db.passwordResetToken.delete({
                where: { id: resetToken.id }
            }),
            db.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SETTINGS_UPDATED', // Using existing action type or could add PASSWORD_RESET
                    details: `Password reset successfully via token.`
                }
            })
        ]);

        revalidatePath('/auth/login');
        return { success: true, message: "Your password has been reset successfully. You can now login." };

    } catch (error) {
        return { success: false, error: "Failed to reset password. Please try again later." };
    }
}
