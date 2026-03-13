import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db as prisma } from './lib/db';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // Callbacks moved to auth.config.ts for Edge compatibility
    session: {
        strategy: "jwt",
        maxAge: 86400, // 24 hours
        updateAge: 3600, // 1 hour
    },
    events: {
        async signIn({ user }) {
            if (user?.id) {
                try {
                    await prisma.auditLog.create({
                        data: {
                            userId: user.id,
                            action: 'USER_LOGIN', // Matches schema enum
                            actionType: 'USER_LOGIN',
                            domain: 'AUTH',
                            context: 'AUTH',
                            summary: `User logged in: ${user.email}`,
                            severity: 'INFO',
                            severityLevel: 'INFO',
                            status: 'SUCCESS',
                            timestamp: new Date(),
                        }
                    })
                } catch (error) {
                    console.error("Failed to log sign-in:", error)
                }
            }
        },
        async signOut(message) {
            // Note: In NextAuth v5, signOut event might be limited in context, 
            // but we can try to log if we have user info or just log generic logout
            // Often session is already gone, so we might not have user ID easily here without extra work
            // For now, we'll log what we can.
        }
    },
    providers: [

        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsed = z.object({
                    email: z.string().email(),
                    password: z.string().min(10),
                }).safeParse(credentials);

                if (!parsed.success) return null;
                const email = parsed.data.email.toLowerCase().trim();
                const password = parsed.data.password;

                try {
                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user) {
                        return null;
                    }

                    // CHECK LOCKOUT
                    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                        const timeLeft = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
                        throw new Error(`Account is locked. Try again in ${timeLeft} minutes.`);
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                    if (passwordsMatch) {
                        // SUCCESS: Reset counters
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: 0,
                                lockoutUntil: null
                            }
                        });

                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            memberId: user.memberId,
                            mustChangePassword: user.mustChangePassword,
                            permissions: user.permissions,
                        };
                    }

                    // FAILURE: Increment counters
                    const attempts = user.failedLoginAttempts + 1;
                    let lockoutUntil = null;

                    if (attempts >= 5) {
                        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
                    }

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: attempts,
                            lockoutUntil: lockoutUntil
                        }
                    });

                    if (lockoutUntil) {
                        throw new Error("Account is locked due to too many failed attempts.");
                    }

                    return null;
                } catch (error) {
                    console.error('Authorize Credentials Error:', error);
                    return null;
                }
            },
        }),
    ],
});
