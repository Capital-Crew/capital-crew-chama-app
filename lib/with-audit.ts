import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AuditContext } from './audit-context';
import { AuditLogAction } from '@prisma/client';

type AuditActionType = AuditLogAction | string;

interface AuditOptions {
    context?: string; // e.g., 'LOAN', 'AUTH'
    action: AuditActionType;
}

/**
 * Higher-Order Function to wrap Server Actions with Audit Logging.
 * 
 * Usage:
 * export const myAction = withAudit({ action: 'MY_ACTION', context: 'DOMAIN' }, async (...) => { ... })
 */
export function withAudit<TArgs extends any[], TResult>(
    options: AuditLogAction | AuditOptions, // Support both old (enum) and new (object) signatures
    businessLogicFn: (...args: TArgs) => Promise<TResult>
) {
    return async (...args: TArgs): Promise<TResult> => {
        // Normalize options
        const actionName = typeof options === 'string' || typeof options === 'object' && !('action' in options)
            ? (options as string)
            : (options as AuditOptions).action;

        const context = typeof options === 'object' && 'context' in options
            ? (options as AuditOptions).context
            : 'SYSTEM';

        // 1. Initialize Context
        AuditContext.flush(); // Clear any previous state
        AuditContext.setContext(context);
        const startTime = Date.now();

        // Get current user
        const session = await auth();
        const userId = session?.user?.id;
        // @ts-ignore // IP might be added to session in auth.ts or passed via headers, for now undefined
        const ipAddress = session?.ip || '0.0.0.0';

        try {
            // 2. Execute Business Logic
            const result = await businessLogicFn(...args);

            // 3. On Success: Log INFO
            if (userId) {
                const durationMs = Date.now() - startTime;
                const steps = AuditContext.getSummary();

                // Construct standard summary
                const stepSummary = steps.map(s => s.action).join(', ');
                const summary = steps.length > 0
                    ? `${actionName} completed. Steps: ${stepSummary}`
                    : `${actionName} completed successfully.`;

                await db.auditLog.create({
                    data: {
                        userId,
                        action: actionName as AuditLogAction,
                        details: JSON.stringify({ status: 'SUCCESS' }), // Legacy
                        summary: summary,
                        context: context,
                        severity: 'INFO',
                        ipAddress: ipAddress,
                        steps: steps as any,
                        metadata: { result: 'SUCCESS' },
                        durationMs: durationMs
                    }
                });
            }

            return result;

        } catch (error: any) {
            // 4. On Failure: Log CRITICAL
            if (userId) {
                const durationMs = Date.now() - startTime;
                AuditContext.error('Action Failed', error); // Add final error step
                const steps = AuditContext.getSummary();

                await db.auditLog.create({
                    data: {
                        userId,
                        action: actionName as AuditLogAction,
                        details: JSON.stringify({ status: 'FAILURE', error: error.message }), // Legacy
                        summary: `${actionName} failed: ${error.message}`,
                        context: context,
                        severity: 'CRITICAL',
                        ipAddress: ipAddress,
                        steps: steps as any,
                        metadata: { result: 'FAILURE', errorStack: error.stack },
                        durationMs: durationMs
                    }
                });
            }

            // Re-throw
            throw error;
        } finally {
            AuditContext.flush();
        }
    };
}
