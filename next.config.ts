import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@react-pdf/renderer'],
  // LIGHTHOUSE FIX 1.1: Remove legacy polyfills for faster JS parsing
  experimental: {
    browsersListForSwc: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // LIGHTHOUSE FIX 3.1: Added Content-Security-Policy and COOP
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.upstash.io https://sandbox.safaricom.co.ke https://api.safaricom.co.ke https://*.intasend.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          }
        ],
      },
      // LIGHTHOUSE FIX 1.5: Enable bfcache by using 'private, no-cache' rather than 'no-store'
      {
        source: '/dashboard',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache' },
        ],
      },
      {
        source: '/(protected)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache' },
        ],
      },
    ];
  },
};

export default nextConfig;
