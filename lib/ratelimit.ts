import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis using environment variables
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a sliding window rate limiter
// Limits: 5 requests per 15 minutes
export const rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "ratelimit:password-reset",
});
