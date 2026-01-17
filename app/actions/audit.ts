'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { AuditLogAction, Prisma } from '@prisma/client'

export type AuditLogFilter = {
    startDate?: string
    endDate?: string
    action?: AuditLogAction
    actorName?: string
    searchTerm?: string
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
 * Fetch paginated audit logs with filtering
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

    const { startDate, endDate, action, actorName, searchTerm } = filters

    // Build Base Query
    const where: Prisma.AuditLogWhereInput = {
        AND: [
            startDate ? { timestamp: { gte: new Date(startDate) } } : {},
            endDate ? { timestamp: { lte: new Date(endDate) } } : {},
            action ? { action: action } : {},
            actorName ? {
                user: {
                    name: { contains: actorName, mode: 'insensitive' }
                }
            } : {},
            searchTerm ? {
                OR: [
                    { details: { contains: searchTerm, mode: 'insensitive' } },
                    { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                    { action: { equals: searchTerm as any } } // Try to match enum if valid, otherwise ignored
                ]
            } : {}
        ]
    }

    try {
        const [logs, total, totalToday, totalThisMonth] = await Promise.all([
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

        // Mock critical alerts (could be specific actions like failed logins if we tracked them)
        const criticalFilter: Prisma.AuditLogWhereInput = {
            OR: [
                { action: AuditLogAction.WALLET_TRANSACTION_REVERSED },
                { action: AuditLogAction.SETTINGS_UPDATED }
            ]
        }

        const criticalAlerts = await prisma.auditLog.count({ where: criticalFilter })

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats: {
                totalToday,
                totalThisMonth,
                criticalAlerts
            }
        }
    } catch (error) {
        console.error("Failed to fetch audit logs:", error)
        throw new Error("Failed to retrieve audit trail data")
    }
}

/**
 * Export all matching logs (for CSV)
 */
export async function exportAuditLogs(filters: AuditLogFilter = {}) {
    const session = await auth()

    // Strict Access Control - System Admin Only
    if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)) {
        throw new Error("Unauthorized: Access Restricted to System Administrator")
    }

    const { startDate, endDate, action, actorName, searchTerm } = filters

    const where: Prisma.AuditLogWhereInput = {
        AND: [
            startDate ? { timestamp: { gte: new Date(startDate) } } : {},
            endDate ? { timestamp: { lte: new Date(endDate) } } : {},
            action ? { action: action } : {},
            actorName ? {
                user: {
                    name: { contains: actorName, mode: 'insensitive' }
                }
            } : {},
            searchTerm ? {
                OR: [
                    { details: { contains: searchTerm, mode: 'insensitive' } },
                    { user: { name: { contains: searchTerm, mode: 'insensitive' } } }
                ]
            } : {}
        ]
    }

    return prisma.auditLog.findMany({
        where,
        include: {
            user: { select: { name: true, email: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000 // reasonable limit for export
    })
}
