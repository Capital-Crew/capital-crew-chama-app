'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { calculateBorrowingPower } from '@/lib/utils/credit-limit'

export async function checkCreditLimit() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Get Member ID
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { memberId: true }
    })

    if (!user?.memberId) throw new Error('Member profile not found')

    // Check credit
    try {
        const credit = await calculateBorrowingPower(user.memberId)
        return {
            canBorrow: credit.maxLoanAmount > 0,
            maxAmount: credit.maxLoanAmount,
            message: credit.maxLoanAmount <= 0 ? "You do not have enough specific borrowing power." : undefined
        }
    } catch (e) {
        console.error(e)
        // Fail open or closed? Closed for safety.
        return { canBorrow: false, maxAmount: 0, message: "Failed to calculate credit limit." }
    }
}
