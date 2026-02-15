import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AuditContext } from './audit-context';
import { AuditLogAction } from '@prisma/client';

type AuditActionType = AuditLogAction | string; // Allow string for flexibility, but prefer Enum

/**
 * Higher-Order Function to wrap Server Actions with Audit Logging.
 * 
 * @param actionName - The high-level action name (e.g., 'LOAN_APPROVAL')
 * @param businessLogicFn - The actual server action logic
 */
export function withAudit<TArgs extends any[], TResult>(
    actionName: AuditActionType,
    businessLogicFn: (...args: TArgs) => Promise<TResult>
) {
    return async (...args: TArgs): Promise<TResult> => {
        // 1. Initialize & Start Timer via Context (implicitly done on first access)
        const startTime = Date.now();

        // Get current user for attribution
        const session = await auth();
        const userId = session?.user?.id;

        try {
            // 2. Execute Business Logic
            const result = await businessLogicFn(...args);

            // 3. On Success: Log to DB
            if (userId) {
                const durationMs = Date.now() - startTime;
                const steps = AuditContext.getSummary();

                // Construct a human-readable summary
                const stepSummary = steps.map(s => s.action).join(', ');
                const summary = steps.length > 0
                    ? `${actionName} completed. Steps: ${stepSummary}`
                    : `${actionName} completed successfully.`;

                await db.auditLog.create({
                    data: {
                        userId,
                        action: actionName as AuditLogAction, // Assumes actionName matches Enum or needs casting
                        details: JSON.stringify({ status: 'SUCCESS' }), // Legacy field
                        summary: summary,
                        steps: steps as any, // JSON
                        metadata: { result: 'SUCCESS' }, // Result metadata
                        durationMs: durationMs
                    }
                });
            }

            return result;

        } catch (error: any) {
            // 4. On Failure: Log Error to DB
            if (userId) {
                const durationMs = Date.now() - startTime;
                const steps = AuditContext.getSummary();

                await db.auditLog.create({
                    data: {
                        userId,
                        action: actionName as AuditLogAction,
                        details: JSON.stringify({ status: 'FAILURE', error: error.message }),
                        summary: `${actionName} failed: ${error.message}`,
                        steps: steps as any,
                        metadata: { result: 'FAILURE', errorStack: error.stack },
                        durationMs: durationMs
                    }
                });
            }

            // Re-throw so UI handles it
            throw error;
        } finally {
            // Cleanup
            AuditContext.flush();
        }
    };
}
