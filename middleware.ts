import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic in-memory rate limiting for sensitive routes
// Note: In production, use @upstash/ratelimit with Redis for cross-instance state
const rateLimitMap = new Map<string, { count: number, windowStart: number }>();
const LIMIT = 10; // requests
const WINDOW = 60 * 1000; // 1 minute

async function rateLimit(request: NextRequest) {
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[a-f0-9:]+$/i
    const ip = (rawIp && IP_REGEX.test(rawIp)) ? rawIp : '127.0.0.1'
    const now = Date.now();

    const record = rateLimitMap.get(ip) || { count: 0, windowStart: now };

    // Reset window if expired
    if (now - record.windowStart > WINDOW) {
        record.count = 1;
        record.windowStart = now;
    } else {
        record.count++;
    }

    rateLimitMap.set(ip, record);

    if (record.count > LIMIT) {
        return NextResponse.json(
            { error: 'Too Many Requests. Please try again in a minute.' },
            { status: 429 }
        );
    }
    return null;
}

const { auth } = NextAuth(authConfig);

const ALLOWED_ORIGIN = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export default auth(async (req) => {
    // 1. CORS Preflight Handling (Security Hardening)
    if (req.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        return response;
    }

    // 2. Rate Limiting Check for API and Auth routes (Protect against brute-force)
    const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth') ||
        req.nextUrl.pathname.startsWith('/login') ||
        req.nextUrl.pathname.startsWith('/auth');

    if (isAuthRoute) {
        const rateLimitResponse = await rateLimit(req);
        if (rateLimitResponse) return rateLimitResponse;
    }

    const response = NextResponse.next();

    // 3. Set Global CORS Header (Secure restricted origin)
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // 4. Security Headers (P2.3)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    return response;
});

export const config = {
    // Pillar 10: Include API routes in middleware matcher for rate limiting
    matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
