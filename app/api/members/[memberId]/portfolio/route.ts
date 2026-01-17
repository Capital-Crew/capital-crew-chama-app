import { NextRequest, NextResponse } from 'next/server'
import { LoanBalanceService } from '@/lib/services/LoanBalanceService'

/**
 * GET /api/members/[memberId]/portfolio
 * 
 * Returns portfolio summary for a member (all their loans)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        const { memberId } = await params

        // Get portfolio balance
        const portfolio = await LoanBalanceService.getMemberPortfolioBalance(memberId)

        return NextResponse.json({
            success: true,
            data: portfolio
        })

    } catch (error: any) {
        console.error('Error fetching member portfolio:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch member portfolio'
            },
            { status: 500 }
        )
    }
}
