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
                // Note: auth.user is typed generically, cast to access role
                const userRole = (auth?.user as any)?.role;
                const allowedRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'SECRETARY', 'TREASURER', 'SYSTEM_ADMINISTRATOR'];

                if (!allowedRoles.includes(userRole)) {
                    // Redirect unauthorized users to dashboard (or 404 via rewrite ideally, but redirect is safer)
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }

            // Allow access to public pages
            return true;
        },
    },
    providers: [], // Providers added in auth.ts (server-side only)
} satisfies NextAuthConfig;
