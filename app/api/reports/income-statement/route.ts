import { NextRequest, NextResponse } from 'next/server'
import { AccountingService } from '@/lib/services/AccountingService'
import { z } from 'zod'

const querySchema = z.object({
    startDate: z.string().transform(val => new Date(val)),
    endDate: z.string().transform(val => new Date(val)),
    basis: z.enum(['CASH', 'ACCRUAL']).default('CASH')
})

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const query = querySchema.parse({
            startDate: searchParams.get('startDate'),
            endDate: searchParams.get('endDate'),
            basis: searchParams.get('basis') || 'CASH'
        })

        const report = await AccountingService.getIncomeStatement(query.startDate, query.endDate, query.basis)

        return NextResponse.json({ report })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
