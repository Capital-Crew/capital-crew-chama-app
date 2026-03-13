import { NextResponse } from 'next/server'
import { PenaltyService } from '@/services/penalty-engine'
import { db as prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api-utils'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    return withAudit(
        { actionType: AuditLogAction.PENALTY_ENGINE_RUN, domain: 'SYSTEM', apiRoute: '/api/cron/penalty', httpMethod: 'GET' },
        async (ctx) => {
            try {
                ctx.beginStep('Execute Penalty Engine');
                const results = await PenaltyService.runDailyCheck()
                ctx.captureAfter({ results });
                ctx.endStep('Execute Penalty Engine');

                return NextResponse.json({
                    message: 'Penalty Check Completed',
                    results
                })
            } catch (error) {
                ctx.setErrorCode('ENGINE_FAILURE');
                return handleApiError(error, 'Penalty Cron GET')
            }
        }
    )(request as any);
}
