import { headers } from 'next/headers';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AuditContext } from './audit-context';
import { AuditLogAction, AuditStatus, Severity } from '@prisma/client';
import { getGeoFromIp } from './utils/geo';

interface AuditConfig {
    actionType: string;   // SCREAMING_SNAKE_CASE e.g. LOAN_APPROVED
    domain: string;   // e.g. LOAN | CONTRIBUTION | MEMBER | FINANCE
    apiRoute: string;   // e.g. /api/loans/approve
    httpMethod?: string;  // defaults to POST
}

type AuditedFn<TArgs extends unknown[], TReturn> = (
    ctx: typeof AuditContext,
    ...args: TArgs
) => Promise<TReturn>;

/**
 * Enhanced withAudit Higher-Order Function.
 * Captures request metadata, sessions, and state diffs.
 */
export function withAudit<TArgs extends unknown[], TReturn>(
    configOrAction: AuditConfig | AuditLogAction,
    fn: AuditedFn<TArgs, TReturn>
) {
    return async (...args: TArgs): Promise<TReturn> => {
        const start = Date.now();
        const requestId = crypto.randomUUID();

        // Normalize config for backward compatibility
        const config: AuditConfig = typeof configOrAction === 'string'
            ? { actionType: configOrAction, domain: 'SYSTEM', apiRoute: 'unknown' }
            : configOrAction;

        // Flush context for the new request
        AuditContext.flush();

        // ── Read request metadata ──────────────────────────────────────
        let ipAddress = 'unknown';
        let userAgent = 'unknown';
        let sessionId: string | undefined = undefined;

        try {
            const hdrs = await headers();
            ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0].trim()
                ?? hdrs.get('x-real-ip')
                ?? 'unknown';
            userAgent = hdrs.get('user-agent') ?? 'unknown';
            sessionId = hdrs.get('x-session-id') ?? undefined;
        } catch (e) {
            // Headers might not be available in some contexts (e.g. background tasks if any)
        }

        // ── Auth context ───────────────────────────────────────────────
        const session = await auth();
        const userId = session?.user?.id ?? 'anonymous';
        const userEmail = session?.user?.email ?? 'unknown';
        const userRole = session?.user?.role ?? 'unknown';

        // ── Optional: geo lookup from IP (Concurrent) ─────────────────
        const geoPromise = getGeoFromIp(ipAddress);

        // ── Run the actual action ──────────────────────────────────────
        let result: TReturn;
        let status: any = 'SUCCESS';
        let severity: any = 'INFO';
        let summary = '';
        let errorStack: string | undefined;

        try {
            result = await fn(AuditContext, ...args);
            summary = `${config.actionType} completed successfully`;
            return result;

        } catch (error) {
            const errorAudit = AuditContext.build();
            status = errorAudit.hadPartialSuccess ? 'PARTIAL' : 'FAILURE';
            severity = 'CRITICAL';
            summary = error instanceof Error ? error.message : 'Unknown error occurred';
            errorStack = error instanceof Error ? error.stack : undefined;
            throw error;

        } finally {
            // ── Write audit log — never block the response ────────────────
            const finalBuild = AuditContext.build();
            try {
                const geolocation = await geoPromise;
                await db.auditLog.create({
                    data: {
                        // Identity
                        ...(userId !== 'anonymous' ? { userId } : {}),
                        userEmail,
                        userRole,
                        ipAddress,
                        userAgent,
                        sessionId,
                        geolocation,
                        requestId,

                        // What happened
                        action: config.actionType as any, // Legacy
                        actionType: config.actionType as any, // New
                        domain: config.domain,
                        context: config.domain, // Legacy alias
                        entityType: finalBuild.entityType ?? 'unknown',
                        entityId: finalBuild.entityId ?? 'unknown',
                        apiRoute: config.apiRoute,
                        httpMethod: config.httpMethod ?? 'POST',

                        // Outcome
                        status,
                        severity: severity === 'CRITICAL' ? 'CRITICAL' : 'INFO', // Legacy String
                        severityLevel: severity, // New Enum
                        summary,
                        errorCode: finalBuild.errorCode,
                        errorStack,

                        // Execution detail
                        steps: finalBuild.steps as any,
                        durationMs: Date.now() - start,

                        // State diff
                        stateBefore: (finalBuild.stateBefore as any) ?? undefined,
                        stateAfter: (finalBuild.stateAfter as any) ?? undefined,
                        diff: (finalBuild.diff as any) ?? undefined,
                    },
                });
            } catch (logError) {
                // Logging must never crash the application
                console.error('[AuditLog] Failed to write audit record:', logError);
            }
            // Context is request-scoped via react cache, no need to flush here but good practice
        }
    };
}
