
import { NextResponse } from 'next/server'
import { PenaltyService } from '@/services/penalty-engine'
import prisma from '@/lib/prisma'

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
    } catch (error: any) {
        console.error('Penalty Cron Failed:', error)

        await prisma.auditLog.create({
            data: {
                userId: 'SYSTEM',
                action: 'PENALTY_ENGINE_RUN',
                details: `Cron trigger FAILED. Error: ${error.message}`
            }
        }).catch(() => { })

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
