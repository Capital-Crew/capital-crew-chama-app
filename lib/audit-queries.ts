
import { db } from '@/lib/db';

/** Full audit history for a specific record (e.g. one Loan) */
export function getEntityHistory(entityType: string, entityId: string) {
    return db.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'asc' },
    });
}

/** Everything a user has ever done */
export function getUserActivity(userId: string, limitDays = 30) {
    return db.auditLog.findMany({
        where: {
            userId,
            createdAt: { gte: new Date(Date.now() - limitDays * 86400_000) },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/** All CRITICAL failures in the last N hours — for admin alerts */
export function getRecentFailures(hours = 24) {
    return db.auditLog.findMany({
        where: {
            severity: 'CRITICAL',
            createdAt: { gte: new Date(Date.now() - hours * 3_600_000) },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/** All actions in a single user session */
export function getSessionActivity(sessionId: string) {
    return db.auditLog.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });
}

/** All actions by domain (e.g. all LOAN events) */
export function getDomainActivity(
    domain: string,
    options?: { from?: Date; to?: Date; status?: 'SUCCESS' | 'FAILURE' | 'PARTIAL' }
) {
    return db.auditLog.findMany({
        where: {
            domain,
            ...(options?.status && { status: options.status }),
            ...(options?.from || options?.to) && {
                createdAt: {
                    ...(options.from && { gte: options.from }),
                    ...(options.to && { lte: options.to }),
                }
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/** Actions that changed a specific field on any entity of a given type */
export function getFieldChangeHistory(entityType: string, fieldName: string) {
    return db.auditLog.findMany({
        where: {
            entityType,
            diff: { path: [fieldName], not: undefined },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/** Paginated audit log for admin dashboard */
export function getPaginatedAuditLog({
    page = 1,
    pageSize = 50,
    domain,
    severity,
    userId,
    from,
    to,
}: {
    page?: number;
    pageSize?: number;
    domain?: string;
    severity?: 'INFO' | 'WARN' | 'CRITICAL';
    userId?: string;
    from?: Date;
    to?: Date;
}) {
    const where = {
        ...(domain && { domain }),
        ...(severity && { severity }),
        ...(userId && { userId }),
        ...((from || to) && {
            createdAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
            },
        }),
    };

    return Promise.all([
        db.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        db.auditLog.count({ where }),
    ]);
}
