import { NextResponse } from 'next/server'
import { InterestService } from '@/services/interest-engine'
import { db as prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api-utils'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction } from '@prisma/client'

export const dynamic = 'force-dynamic' // Ensure it runs every time

export async function GET(request: Request) {
    return withAudit(
        { actionType: AuditLogAction.INTEREST_ENGINE_RUN, domain: 'SYSTEM', apiRoute: '/api/cron/interest', httpMethod: 'GET' },
        async (ctx) => {
            try {
                ctx.beginStep('Verify Authorization');
                const authHeader = request.headers.get('authorization')
                if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                    ctx.setErrorCode('UNAUTHORIZED');
                    return new NextResponse('Unauthorized', { status: 401 })
                }
                ctx.endStep('Verify Authorization');

                ctx.beginStep('Execute Interest Engine');
                const results = await InterestService.processMonthlyBatch()
                ctx.captureAfter({ results });
                ctx.endStep('Execute Interest Engine');

                return NextResponse.json({
                    message: 'Interest Batch Processed',
                    results
                })
            } catch (error) {
                ctx.setErrorCode('ENGINE_FAILURE');
                return handleApiError(error, 'Interest Cron GET')
            }
        }
    )(request as any); // withAudit wrapper takes arguments of the function it wraps
}
