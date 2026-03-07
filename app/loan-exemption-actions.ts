'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

interface LoanExemptions {
    processingFee?: boolean
    insuranceFee?: boolean
    defaultCheck?: boolean
}

/**
 * Update loan exemptions with permission validation
 * Users cannot modify exemptions on their own loans
 */
export async function updateLoanExemptions(loanId: string, exemptions: LoanExemptions) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { error: 'Unauthorized' }
        }

        // Fetch the loan to check ownership
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: {
                member: {
                    include: {
                        user: true
                    }
                }
            }
        })

        if (!loan) {
            return { error: 'Loan not found' }
        }

        // PERMISSION CHECK: Prevent users from modifying their own loan exemptions
        if (loan.member.user?.id === session.user.id) {
            return { error: 'You cannot modify exemptions on your own loan. Please contact an administrator.' }
        }

        // STAGE CHECK: Only allow exemption updates during Draft/Application stage
        if (loan.status !== 'APPLICATION') {
            return { error: 'Exemptions can only be modified when the loan is in Draft/Application stage.' }
        }

        // Update the exemptions
        await db.loan.update({
            where: { id: loanId },
            data: {
                feeExemptions: exemptions as any
            }
        })

        revalidatePath('/loans')
        revalidatePath(`/loans/${loanId}`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update exemptions' }
    }
}

/**
 * Get loan exemptions
 */
export async function getLoanExemptions(loanId: string) {
    try {
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            select: {
                feeExemptions: true
            }
        })

        return loan?.feeExemptions as LoanExemptions || {}
    } catch (error: any) {
        return {}
    }
}
