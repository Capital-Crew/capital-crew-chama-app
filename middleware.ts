import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: In production, use @upstash/ratelimit with Redis
// This is a placeholder for the Rate Limiting Pillar (Pillar 10)
async function rateLimit(request: NextRequest) {
    const ip = request.ip ?? '127.0.0.1';
    // const { success } = await ratelimit.limit(ip);
    // if (!success) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    return null;
}

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
    // 1. Rate Limiting Check for API and Auth routes
    if (req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/auth')) {
        const rateLimitResponse = await rateLimit(req);
        if (rateLimitResponse) return rateLimitResponse;
    }

    return NextResponse.next();
});

export const config = {
    // Pillar 10: Include API routes in middleware matcher for rate limiting
    matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
