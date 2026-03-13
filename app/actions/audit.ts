'use server'

import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { AuditLogAction, Prisma } from '@prisma/client'

export type AuditLogFilter = {
    startDate?: string
    endDate?: string
    action?: AuditLogAction
    actorName?: string
    searchTerm?: string
    domain?: string
    status?: string
}

export type AuditLogResponse = {
    logs: any[]
    total: number
    page: number
    totalPages: number
    stats: {
        totalToday: number
        totalThisMonth: number
        criticalAlerts: number
    }
}

/**
 * Fetch paginated audit logs with filtering (HIGH RICHNESS)
 */
export async function getAuditLogs(
    page: number = 1,
    limit: number = 20,
    filters: AuditLogFilter = {}
): Promise<AuditLogResponse> {
    const session = await auth()

    // Strict Access Control - System Admin Only
    if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)) {
        throw new Error("Unauthorized: Access Restricted to System Administrator")
    }

    const { startDate, endDate, action, actorName, searchTerm, domain, status } = filters

    // Build Base Query
    const where: Prisma.AuditLogWhereInput = {
        AND: [
            startDate ? { timestamp: { gte: new Date(startDate) } } : {},
            endDate ? { timestamp: { lte: new Date(endDate) } } : {},
            action ? { action: action } : {},
            domain ? { domain: domain } : {}, // New: Domain filter
            status ? { status: status as any } : {}, // New: Status filter
            actorName ? {
                user: {
                    name: { contains: actorName, mode: 'insensitive' }
                }
            } : {},
            searchTerm ? {
                OR: [
                    { details: { contains: searchTerm, mode: 'insensitive' } },
                    { summary: { contains: searchTerm, mode: 'insensitive' } },
                    { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                    { requestId: { contains: searchTerm, mode: 'insensitive' } }
                ]
            } : {}
        ]
    }

    try {
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, email: true, role: true }
                    }
                },
                orderBy: { timestamp: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.auditLog.count({ where }),
        ])

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats: {
                totalToday: 0,
                totalThisMonth: 0,
                criticalAlerts: 0
            } // Fetched separately by getAuditStats
        }
    } catch (error) {
        console.error("[getAuditLogs] Error:", error);
        throw new Error("Failed to retrieve audit trail data")
    }
}

/**
 * Fetch Audit Stats Separately (HEAVY)
 */
export async function getAuditStats() {
    const session = await auth()
    if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)) {
        return { totalToday: 0, totalThisMonth: 0, criticalAlerts: 0 }
    }

    try {
        const [totalToday, totalThisMonth] = await Promise.all([
            prisma.auditLog.count({
                where: { timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
            }),
            prisma.auditLog.count({
                where: {
                    timestamp: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            })
        ])

        // Critical Alerts: Reversed transactions, Settings changes, and Failed actions
        const criticalFilter: Prisma.AuditLogWhereInput = {
            OR: [
                { action: AuditLogAction.WALLET_TRANSACTION_REVERSED },
                { action: AuditLogAction.SETTINGS_UPDATED },
                { status: 'FAILURE' }
            ]
        }
        const criticalAlerts = await prisma.auditLog.count({ where: criticalFilter })

        return { totalToday, totalThisMonth, criticalAlerts }

    } catch (error) {
        return { totalToday: 0, totalThisMonth: 0, criticalAlerts: 0 }
    }
}

/**
 * Export all matching logs (for CSV) with full metadata
 */
export async function exportAuditLogs(filters: AuditLogFilter = {}) {
    const session = await auth()

    if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)) {
        throw new Error("Unauthorized: Access Restricted to System Administrator")
    }

    const { startDate, endDate, action, actorName, searchTerm, domain, status } = filters

    const where: Prisma.AuditLogWhereInput = {
        AND: [
            startDate ? { timestamp: { gte: new Date(startDate) } } : {},
            endDate ? { timestamp: { lte: new Date(endDate) } } : {},
            action ? { action: action } : {},
            domain ? { domain: domain } : {},
            status ? { status: status as any } : {},
            actorName ? {
                user: {
                    name: { contains: actorName, mode: 'insensitive' }
                }
            } : {},
            searchTerm ? {
                OR: [
                    { details: { contains: searchTerm, mode: 'insensitive' } },
                    { summary: { contains: searchTerm, mode: 'insensitive' } },
                    { user: { name: { contains: searchTerm, mode: 'insensitive' } } }
                ]
            } : {}
        ]
    }

    return prisma.auditLog.findMany({
        where,
        include: {
            user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: 2000 // reasonable limit for export
    })
}
