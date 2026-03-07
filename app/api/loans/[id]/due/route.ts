import { NextRequest, NextResponse } from 'next/server'
import { MonthlyDueService } from '@/lib/services/MonthlyDueService'
import { db } from '@/lib/db'

/**
 * GET /api/loans/[id]/due
 * 
 * Returns current due amounts (arrears + current period)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: loanId } = await params
        const { searchParams } = new URL(request.url)

        // Optional: Calculate as of specific date
        const asOfDateParam = searchParams.get('asOfDate')
        const asOfDate = asOfDateParam ? new Date(asOfDateParam) : new Date()

        // Verify loan exists
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            select: { id: true, status: true }
        })

        if (!loan) {
            return NextResponse.json(
                { error: 'Loan not found' },
                { status: 404 }
            )
        }

        // Get due breakdown
        const breakdown = await MonthlyDueService.getDueBreakdown(loanId, asOfDate)

        return NextResponse.json({
            success: true,
            data: breakdown
        })

    } catch (error: any) {

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch due amounts'
            },
            { status: 500 }
        )
    }
}
