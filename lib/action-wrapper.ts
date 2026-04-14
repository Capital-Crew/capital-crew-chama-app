import { AppError, ErrorCodes } from './errors';
import { mapPrismaError } from './prisma-mapper';
import { logger } from './logger';
import { saveErrorToDb } from './error-logger';
import crypto from 'crypto';
import { auth } from '@/auth';

/**
 * Higher-Order Function to wrap Server Actions with centralized error handling.
 * Server Actions usually return a result object { success: boolean, data?: T, error?: string }
 */
export function withActionErrorHandler<T, Args extends any[]>(
    actionName: string,
    action: (...args: Args) => Promise<T>
): (...args: Args) => Promise<{ success: true; data: T } | { success: false; errorCode: string; message: string; requestId: string }> {
    return async (...args: Args) => {
        const requestId = crypto.randomUUID();
        const startTime = Date.now();

        try {
            const data = await action(...args);
            return { success: true, data };
        } catch (err: any) {
            const appError = err instanceof AppError ? err : mapPrismaError(err);
            const session = await auth();

            const internalLog = {
                errorCode: appError.errorCode,
                technicalMessage: err.message,
                stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
                requestId,
                userId: session?.user?.id,
                metadata: { actionName, args: redactArgs(args) },
            };

            // 1. Log to structured console/winston
            logger.error(`[ACTION_ERROR] ${actionName}`, {
                ...internalLog,
                durationMs: Date.now() - startTime,
            });

            // 2. Save to append-only Audit DB
            await saveErrorToDb(internalLog);

            if (!appError.isOperational) {
                // TODO: trigger PagerDuty / Sentry alert
                console.error(`CRITICAL ACTION ERROR [${actionName}]:`, err);
            }

            return {
                success: false,
                errorCode: appError.errorCode,
                message: appError.message,
                requestId,
            };
        }
    };
}

/**
 * Simplified redaction for action arguments during logging.
 */
function redactArgs(args: any[]): any[] {
    const PII_FIELDS = ['password', 'cvv', 'pan', 'ssn', 'accountNumber', 'pin', 'secret'];
    
    return args.map(arg => {
        if (typeof arg !== 'object' || arg === null) return arg;
        
        const redacted = { ...arg };
        for (const key in redacted) {
            if (PII_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                redacted[key] = '[REDACTED]';
            }
        }
        return redacted;
    });
}
