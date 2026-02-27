import { NextRequest, NextResponse } from 'next/server'
import { AccountingService } from '@/lib/services/AccountingService'
import { z } from 'zod'
import { auth } from '@/auth'
import { handleApiError } from '@/lib/api-utils'

const querySchema = z.object({
    startDate: z.string().transform(val => new Date(val)),
    endDate: z.string().transform(val => new Date(val)),
    basis: z.enum(['CASH', 'ACCRUAL']).default('CASH')
})

export async function GET(req: NextRequest) {
    // 0. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const searchParams = req.nextUrl.searchParams
        const query = querySchema.parse({
            startDate: searchParams.get('startDate'),
            endDate: searchParams.get('endDate'),
            basis: searchParams.get('basis') || 'CASH'
        })

        const report = await AccountingService.getIncomeStatement(query.startDate, query.endDate, query.basis)

        return NextResponse.json({ report })
    } catch (error) {
        return handleApiError(error, 'Income Statement GET')
    }
}
