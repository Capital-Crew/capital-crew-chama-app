import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                console.log('JWT Callback - User on Signin:', { id: user.id, memberId: user.memberId })
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.memberId = user.memberId;
            }
            return token;
        },
        session({ session, token }) {
            console.log('Session Callback - Token:', token)
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.role = token.role as string;
                // @ts-ignore
                session.user.memberId = token.memberId as string;
            }
            console.log('Session Callback - Final Session:', session)
            return session;
        },
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

                console.log('Authorize - User Found:', { id: user.id, memberId: user.memberId })

                const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        memberId: user.memberId,
                    };
                }

                return null;
            },
        }),
    ],
});
