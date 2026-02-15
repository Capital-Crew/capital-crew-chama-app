import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AuditLog, Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

interface GetAuditLogsParams {
    cursor?: string;
    limit?: number;
    severity?: string;
    action?: string;
    userId?: string;
}

interface GetAuditLogsResponse {
    data: AuditLog[];
    nextCursor?: string;
}

export async function getAuditLogs({
    cursor,
    limit = PAGE_SIZE,
    severity,
    action,
    userId
}: GetAuditLogsParams = {}): Promise<GetAuditLogsResponse> {
    const session = await auth();

    // 1. Strict RBAC
    const allowedRoles = ['CHAIRPERSON', 'SYSTEM_ADMINISTRATOR', 'SYSTEM_ADMIN'];

    if (!session?.user) {
        console.error('[getAuditLogs] No session found');
        throw new Error('Unauthorized: No session');
    }

    if (!allowedRoles.includes(session.user.role)) {
        console.error(`[getAuditLogs] Access Denied. User: ${session.user.email}, Role: ${session.user.role}`);
        throw new Error(`Unauthorized: Role ${session.user.role} not allowed`);
    }

    // 2. Build Query
    const where: Prisma.AuditLogWhereInput = {};
    if (severity) where.severity = severity;
    if (action) where.action = action as any; // Cast as enum match might be tricky with string input
    if (userId) where.userId = userId;

    // 3. Fetch Data with Cursor Pagination
    const logs = await db.auditLog.findMany({
        take: limit + 1, // Fetch one extra to determine if there's a next page
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { timestamp: 'desc' },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    let nextCursor: string | undefined = undefined;
    if (logs.length > limit) {
        const nextItem = logs.pop();
        nextCursor = nextItem?.id;
    }

    return {
        data: logs,
        nextCursor
    };
}
