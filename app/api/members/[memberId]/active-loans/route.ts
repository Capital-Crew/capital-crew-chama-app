import { db as prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { memberId } = await params

        // Fetch member's active loans (loans with outstanding balance > 0)
        const loans = await prisma.loan.findMany({
            where: {
                memberId,
                status: { in: ['ACTIVE', 'OVERDUE'] }
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
        return NextResponse.json(
            { error: error.message || 'Failed to fetch active loans' },
            { status: 500 }
        )
    }
}
