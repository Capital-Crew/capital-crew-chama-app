import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError, ErrorCodes, AppErrorPayload } from './errors';
import { mapPrismaError } from './prisma-mapper';
import { logger } from './logger';
import { saveErrorToDb } from './error-logger';
import crypto from 'crypto';
import { auth } from '@/auth';

/**
 * Type for Next.js Route Handlers
 */
type RouteHandler = (
    request: NextRequest,
    context: any
) => Promise<Response | NextResponse>;

/**
 * Higher-Order Function to wrap Route Handlers with centralized error handling.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
    return async (request: NextRequest, context: any) => {
        const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
        const startTime = Date.now();

        try {
            const session = await auth();
            const response = await handler(request, context);
            return response;
        } catch (err: any) {
            const appError = err instanceof AppError ? err : mapPrismaError(err);
            const session = await auth();
            
            const internalLog = {
                errorCode: appError.errorCode,
                technicalMessage: err.message,
                stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
                requestId,
                endpoint: request.url,
                method: request.method,
                userId: session?.user?.id,
            };

            // 1. Log to structured console/winston
            logger.error(`[API_ERROR] ${request.method} ${request.url}`, {
                ...internalLog,
                duration: Date.now() - startTime,
            });

            // 2. Save to append-only Audit DB (Required for financial systems)
            await saveErrorToDb(internalLog);

            if (!appError.isOperational) {
                // TODO: trigger PagerDuty / Sentry alert
                console.error('CRITICAL ERROR:', err);
            }

            const payload: AppErrorPayload = {
                success: false,
                errorCode: appError.errorCode,
                message: appError.message,
                requestId,
                timestamp: new Date().toISOString(),
                ...(appError.fieldErrors && { errors: appError.fieldErrors }),
            };

            return NextResponse.json(payload, { status: appError.statusCode });
        }
    };
}

/**
 * Zod validation helper that throws AppError on failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const fieldErrors = Object.fromEntries(
            result.error.errors.map((e) => [e.path.join('.'), e.message])
        );
        throw new AppError(
            'Validation failed',
            400,
            ErrorCodes.INVALID_INPUT,
            true,
            fieldErrors
        );
    }
    return result.data;
}
