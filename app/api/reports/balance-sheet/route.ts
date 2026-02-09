import { NextRequest, NextResponse } from 'next/server'
import { AccountingService } from '@/lib/services/AccountingService'
import { z } from 'zod'

const querySchema = z.object({
    asOfDate: z.string().transform(val => new Date(val)).default(() => new Date().toISOString())
})

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const query = querySchema.parse({
            asOfDate: searchParams.get('asOfDate') || new Date().toISOString()
        })

        const report = await AccountingService.getBalanceSheet(query.asOfDate)

        return NextResponse.json({ report })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
