import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWalletBalance } from '@/app/wallet-actions'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        const session = await auth()
        const { memberId } = await params

        console.log('[Wallet API] Request for memberId:', memberId)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userMemberId = (session.user as any).memberId
        const userRole = (session.user as any).role
        const isAdmin = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(userRole)

        if (!isAdmin && userMemberId !== memberId) {
            return NextResponse.json({ error: 'Forbidden: You can only view your own wallet' }, { status: 403 })
        }

        // Try to get wallet balance
        try {
            const walletInfo = await getWalletBalance(memberId)
            console.log('[Wallet API] Success:', walletInfo)
            return NextResponse.json(walletInfo, { status: 200 })
        } catch (walletError: any) {
            console.error('[Wallet API] getWalletBalance error:', walletError.message)

            // Return empty wallet data instead of failing
            return NextResponse.json({
                balance: 0,
                totalContributions: 0,
                activeLoansAmount: 0,
                availableLimit: 0,
                transactions: []
            }, { status: 200 })
        }
    } catch (error: any) {
        console.error('[Wallet API] Fatal error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch wallet information' },
            { status: 500 }
        )
    }
}
