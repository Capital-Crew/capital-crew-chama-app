import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createWalletTransaction } from '@/app/wallet-actions'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        const session = await auth()
        const { memberId } = await params

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }


        const userRole = (session.user as any).role

        // Only Chairperson and Treasurer can create transactions
        const canCreateTransactions = ['CHAIRPERSON', 'TREASURER'].includes(userRole)

        if (!canCreateTransactions) {
            return NextResponse.json(
                { error: 'Forbidden: Only Chairperson and Treasurer can create wallet transactions' },
                { status: 403 }
            )
        }

        // Parse request body
        const body = await request.json()

        // Create transaction (validation happens in server action)
        const transaction = await createWalletTransaction({
            memberId,
            type: body.type,
            amount: body.amount,
            description: body.description,
            relatedLoanId: body.relatedLoanId,
            userId: session.user.id as string
        })

        return NextResponse.json({
            success: true,
            transaction
        }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to create transaction' },
            { status: 500 }
        )
    }
}
