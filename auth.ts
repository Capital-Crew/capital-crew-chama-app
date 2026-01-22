import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // Callbacks moved to auth.config.ts for Edge compatibility
    session: {
        strategy: "jwt",
        maxAge: 300, // 5 minutes
        updateAge: 60, // Extend session every minute if active
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
                    password: z.string().min(6),
                }).safeParse(credentials);

                if (!parsed.success) return null;
                const email = parsed.data.email.toLowerCase().trim();
                const password = parsed.data.password;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    console.log('Authorize - User not found:', email)
                    return null;
                }

                // CHECK LOCKOUT
                if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                    const timeLeft = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
                    throw new Error(`Account is locked. Try again in ${timeLeft} minutes.`);
                }

                console.log('Authorize - User Found:', { id: user.id, memberId: user.memberId })

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
            },
        }),
    ],
});
