import { NextRequest, NextResponse } from 'next/server'
import { AccountingService } from '@/lib/services/AccountingService'
import { z } from 'zod'
import { auth } from '@/auth'
import { handleApiError } from '@/lib/api-utils'

const querySchema = z.object({
    asOfDate: z.string().default(() => new Date().toISOString()).transform(val => new Date(val))
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
            asOfDate: searchParams.get('asOfDate') || new Date().toISOString()
        })

        const report = await AccountingService.getBalanceSheet(query.asOfDate)

        return NextResponse.json({ report })
    } catch (error) {
        return handleApiError(error, 'Balance Sheet GET')
    }
}
