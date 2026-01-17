import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Use only the lightweight authConfig for Edge middleware
// This avoids bundling heavy dependencies like Prisma, bcryptjs, and zod
export default NextAuth(authConfig).auth;

export const config = {
    // Protect all routes except API, static files, images, and favicon
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
