/**
 * Post/Disburse an approved loan
 * This is a public server action that can be called from the frontend
 */
'use server'

import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { disburseLoanToWallet } from './loan-approval-actions'

export async function postApprovedLoan(loanId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Verify loan exists and is approved
    const loan = await prisma.loan.findUnique({
        where: { id: loanId }
    })

    if (!loan) {
        throw new Error('Loan not found')
    }

    if (loan.status !== 'APPROVED') {
        throw new Error(`Loan must be APPROVED to disburse. Current status: ${loan.status}`)
    }

    // Call the internal disbursement function
    await disburseLoanToWallet(loanId)

    // Revalidate paths
    revalidatePath('/loans')
    revalidatePath('/dashboard')

    return { success: true, message: 'Loan posted and funds disbursed successfully' }
}

// Note: disburseLoanToWallet function is defined earlier in this file (line 243)
