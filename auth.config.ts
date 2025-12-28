
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            } else if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
                return true;
            }

            // Allow access to other pages (e.g. root /)
            // If strictly protected, add more logic. For consolidation app, assume other pages public or handled.
            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
