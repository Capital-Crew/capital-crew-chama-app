
import { NextResponse } from 'next/server'
import { PenaltyService } from '@/services/penalty-engine'
import { db as prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const results = await PenaltyService.runDailyCheck()

        // Log execution for health monitoring
        await prisma.auditLog.create({
            data: {
                userId: 'SYSTEM',
                action: 'PENALTY_ENGINE_RUN',
                details: `Cron trigger. Processed: ${results.processed}, Penalties Applied: ${results.penaltiesApplied}`
            }
        })

        return NextResponse.json({
            message: 'Penalty Check Completed',
            results
        })
    } catch (error) {
        return handleApiError(error, 'Penalty Cron GET')
    }
}
