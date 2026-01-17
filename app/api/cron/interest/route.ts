
import { NextResponse } from 'next/server'
import { InterestService } from '@/services/interest-engine'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic' // Ensure it runs every time

export async function GET(request: Request) {
    try {
        // Optional: Add secret key validation here
        // const authHeader = request.headers.get('authorization')
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new NextResponse('Unauthorized', { status: 401 })
        // }

        const results = await InterestService.processMonthlyBatch()

        // Log execution for health monitoring
        await prisma.auditLog.create({
            data: {
                userId: 'SYSTEM',
                action: 'INTEREST_ENGINE_RUN',
                details: `Cron trigger. Success: ${results.success}, Failed: ${results.failed}`
            }
        })

        return NextResponse.json({
            message: 'Interest Batch Processed',
            results
        })
    } catch (error: any) {
        console.error('Cron Job Failed:', error)

        await prisma.auditLog.create({
            data: {
                userId: 'SYSTEM',
                action: 'INTEREST_ENGINE_RUN',
                details: `Cron trigger FAILED. Error: ${error.message}`
            }
        }).catch(() => { })

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
