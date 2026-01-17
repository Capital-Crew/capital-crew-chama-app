'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { InterestService } from '@/services/interest-engine'
import { PenaltyService } from '@/services/penalty-engine'
import { revalidatePath } from 'next/cache'

const prisma = db

/**
 * Get Engine Health Status
 * Returns last run times and statistics for all engines
 */
export async function getEngineHealthStatus() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Get last run times from audit logs
    const [lastInterestRun, lastPenaltyRun] = await Promise.all([
        prisma.auditLog.findFirst({
            where: { action: 'INTEREST_ENGINE_RUN' },
            orderBy: { timestamp: 'desc' }
        }),
        prisma.auditLog.findFirst({
            where: { action: 'PENALTY_ENGINE_RUN' },
            orderBy: { timestamp: 'desc' }
        })
    ])

    // Get active loans count (for context)
    const activeLoansCount = await prisma.loan.count({
        where: { status: 'ACTIVE' }
    })

    return {
        interestEngine: {
            lastRun: lastInterestRun?.timestamp || null,
            lastRunBy: lastInterestRun?.details || 'Never',
            status: lastInterestRun ? 'operational' : 'pending'
        },
        penaltyEngine: {
            lastRun: lastPenaltyRun?.timestamp || null,
            lastRunBy: lastPenaltyRun?.details || 'Never',
            status: lastPenaltyRun ? 'operational' : 'pending'
        },
        activeLoansCount
    }
}

/**
 * Manually trigger Interest Engine (Monthly Batch)
 */
export async function triggerInterestEngine() {
    const session = await auth()

    // Strict permission check
    if (!session?.user || !['CHAIRPERSON', 'TREASURER'].includes(session.user.role)) {
        throw new Error('Unauthorized: Only Chairperson or Treasurer can trigger engines')
    }

    try {
        const results = await InterestService.processMonthlyBatch()

        // Log execution
        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'INTEREST_ENGINE_RUN',
                    details: `Manual trigger by ${session.user.name}. Success: ${results.success}, Failed: ${results.failed}`
                }
            })
        } catch (logError) {
            console.error('Failed to log interest engine execution:', logError)
        }

        revalidatePath('/admin/system')
        return { success: true, results }
    } catch (error: any) {
        console.error('Interest Engine Manual Trigger Failed:', error)

        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'INTEREST_ENGINE_RUN',
                    details: `Manual trigger FAILED by ${session.user.name}. Error: ${error.message}`
                }
            })
        } catch (logError) {
            console.error('Failed to log interest engine failure:', logError)
        }

        return { success: false, error: error.message }
    }
}

/**
 * Manually trigger Penalty Engine (Daily Check)
 */
export async function triggerPenaltyEngine() {
    const session = await auth()

    // Strict permission check
    if (!session?.user || !['CHAIRPERSON', 'TREASURER'].includes(session.user.role)) {
        throw new Error('Unauthorized: Only Chairperson or Treasurer can trigger engines')
    }

    try {
        const results = await PenaltyService.runDailyCheck()

        // Log execution
        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'PENALTY_ENGINE_RUN',
                    details: `Manual trigger by ${session.user.name}. Processed: ${results.processed}, Penalties Applied: ${results.penaltiesApplied}`
                }
            })
        } catch (logError) {
            console.error('Failed to log penalty engine execution:', logError)
        }

        revalidatePath('/admin/system')
        return { success: true, results }
    } catch (error: any) {
        console.error('Penalty Engine Manual Trigger Failed:', error)

        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'PENALTY_ENGINE_RUN',
                    details: `Manual trigger FAILED by ${session.user.name}. Error: ${error.message}`
                }
            })
        } catch (logError) {
            console.error('Failed to log penalty engine failure:', logError)
        }

        return { success: false, error: error.message }
    }
}

/**
 * Get Engine Execution History
 */
export async function getEngineExecutionHistory(limit = 10) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const history = await prisma.auditLog.findMany({
        where: {
            action: { in: ['INTEREST_ENGINE_RUN', 'PENALTY_ENGINE_RUN'] }
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
            user: {
                select: { name: true, email: true }
            }
        }
    })

    return history
}

/**
 * One-time migration to initialize nextInterestRunDate for existing active loans
 * This allows the Interest Engine to process loans that were disbursed before the engine was activated
 */
export async function initializeInterestDatesForExistingLoans() {
    const session = await auth()

    if (!session?.user || !['CHAIRPERSON', 'TREASURER'].includes(session.user.role)) {
        throw new Error('Unauthorized: Only Chairperson or Treasurer can run this migration')
    }

    try {
        // Find all ACTIVE loans and filter for those without nextInterestRunDate
        const allActiveLoans = await prisma.loan.findMany({
            where: {
                status: 'ACTIVE'
            }
        })

        // Filter in JavaScript to avoid Prisma type issues with null
        const loansNeedingInit = allActiveLoans.filter(loan => !loan.nextInterestRunDate)

        console.log(`Found ${loansNeedingInit.length} loans needing interest date initialization`)
        console.log(`Total active loans: ${allActiveLoans.length}`)

        let updated = 0
        const now = new Date()

        for (const loan of loansNeedingInit) {
            // Set nextInterestRunDate to today so the Interest Engine will process it
            // Set lastInterestRunDate to disbursement date (or a past date)
            await prisma.loan.update({
                where: { id: loan.id },
                data: {
                    nextInterestRunDate: now, // Set to now so it gets picked up immediately
                    lastInterestRunDate: loan.disbursementDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago as fallback
                }
            })
            updated++
        }

        // Get info about existing loans for diagnostic
        const loansWithDates = allActiveLoans.filter(loan => loan.nextInterestRunDate)
        const diagnosticInfo = loansWithDates.length > 0
            ? `\n\n${loansWithDates.length} loans already have interest dates set:\n${loansWithDates.map(l => `- ${l.loanApplicationNumber}: Next run ${l.nextInterestRunDate?.toLocaleDateString()}`).join('\n')}`
            : ''

        return {
            success: true,
            message: `Initialized interest dates for ${updated} active loans${diagnosticInfo}`,
            loansUpdated: updated
        }
    } catch (error: any) {
        console.error('Failed to initialize interest dates:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Force all active loans to be processed by Interest Engine
 * Sets nextInterestRunDate to today for all ACTIVE loans
 */
export async function forceInterestRunForAllLoans() {
    const session = await auth()

    if (!session?.user || !['CHAIRPERSON', 'TREASURER'].includes(session.user.role)) {
        throw new Error('Unauthorized: Only Chairperson or Treasurer can force engine runs')
    }

    try {
        // Set to 1 minute in the past to ensure the <= comparison picks them up
        const runDate = new Date(Date.now() - 60000) // 1 minute ago

        // Update all ACTIVE loans to have nextInterestRunDate = 1 minute ago
        const result = await prisma.loan.updateMany({
            where: {
                status: 'ACTIVE'
            },
            data: {
                nextInterestRunDate: runDate
            }
        })

        return {
            success: true,
            message: `Set ${result.count} active loans to run immediately`,
            loansUpdated: result.count
        }
    } catch (error: any) {
        console.error('Failed to force interest run:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
