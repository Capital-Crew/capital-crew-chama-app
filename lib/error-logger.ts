import { db } from './db';
import { logger } from './logger';

export interface InternalErrorLog {
    errorCode: string;
    technicalMessage: string;
    stack?: string;
    userId?: string;
    requestId: string;
    endpoint?: string;
    method?: string;
    correlationId?: string;
    affectedEntityId?: string;
    metadata?: any;
}

/**
 * Saves a technical error log to the append-only ErrorAuditLog table.
 * Fails silently to prevent error handling from crashing the app.
 */
export async function saveErrorToDb(log: InternalErrorLog) {
    try {
        await db.errorAuditLog.create({
            data: {
                errorCode: log.errorCode,
                technicalMessage: log.technicalMessage,
                stack: log.stack,
                userId: log.userId,
                requestId: log.requestId,
                endpoint: log.endpoint,
                method: log.method,
                correlationId: log.correlationId,
                affectedEntityId: log.affectedEntityId,
                metadata: log.metadata,
                timestamp: new Date(),
            },
        });
    } catch (dbErr) {
        // Fallback to winston if DB logging fails
        logger.error('Failed to save error to ErrorAuditLog table', {
            originalError: log.errorCode,
            originalRequestId: log.requestId,
            dbError: (dbErr as any).message,
        });
    }
}
