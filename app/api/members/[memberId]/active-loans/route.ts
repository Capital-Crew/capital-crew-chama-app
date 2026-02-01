import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        const session = await auth()
        console.log('[Active Loans API] Session check:', { hasUser: !!session?.user, requestUrl: req.url, memberId: (await params).memberId })

        if (!session?.user) {
            console.log('[Active Loans API] 401 Unauthorized - No session')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { memberId } = await params

        // Fetch member's active loans (loans with outstanding balance > 0)
        const loans = await prisma.loan.findMany({
            where: {
                memberId,
                current_balance: { gt: 0 },
                status: { in: ['ACTIVE'] }
            },
            include: {
                loanProduct: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { disbursementDate: 'desc' }
        })

        return NextResponse.json({
            loans,
            count: loans.length
        })
    } catch (error: any) {
        console.error('[Active Loans API] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch active loans' },
            { status: 500 }
        )
    }
}
