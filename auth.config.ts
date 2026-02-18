import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth configuration for middleware
// This file must NOT import any heavy dependencies (Prisma, bcryptjs, zod, etc.)
export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnProtected =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/members') ||
                nextUrl.pathname.startsWith('/loans') ||
                nextUrl.pathname.startsWith('/settings') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/accounts') ||
                nextUrl.pathname.startsWith('/reports') ||
                nextUrl.pathname.startsWith('/wallet');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            // Redirect unauthenticated users to login
            if (isOnProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            // Redirect authenticated users away from login
            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
                return true;
            }

            // Protect Admin Routes
            const restrictedAdminPaths = ['/admin/system', '/audit', '/accounts'];
            const isRestrictedAdmin = restrictedAdminPaths.some(path => nextUrl.pathname.startsWith(path));

            if (isRestrictedAdmin) {
                if (!isLoggedIn) return false; // Force login

                // Strict RBAC Check
                // Note: auth.user is typed generically
                const userRole = (auth?.user as any)?.role;
                const allowedRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'SECRETARY', 'TREASURER', 'SYSTEM_ADMINISTRATOR', 'MEMBER'];

                if (!allowedRoles.includes(userRole)) {
                    // Redirect unauthorized users to dashboard
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }

            // Allow access to public pages
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.memberId = user.memberId;
                token.mustChangePassword = user.mustChangePassword;
                token.permissions = user.permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.role = token.role;
                session.user.memberId = token.memberId;
                session.user.mustChangePassword = token.mustChangePassword;
                session.user.permissions = token.permissions;
            }
            return session;
        },
    },
    providers: [], // Providers added in auth.ts (server-side only)
} satisfies NextAuthConfig;
