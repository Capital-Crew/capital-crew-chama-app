import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
    const isOnLogin = req.nextUrl.pathname.startsWith('/login');

    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next();
        return Response.redirect(new URL('/login', req.nextUrl)); // Redirect to login
    }

    if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', req.nextUrl)); // Redirect to dashboard
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
