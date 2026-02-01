'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getNextLoanNumber } from '@/lib/utils'

/**
 * Starts a new loan application by creating a blank DRAFT record.
 * This ensures the Loan Number is reserved immediately.
 */
export async function startLoanApplication(memberId?: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Determine Member ID
    // If not provided, try to use session user's memberId
    let targetMemberId = memberId
    if (!targetMemberId) {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { memberId: true, role: true }
        })
        targetMemberId = user?.memberId || undefined

        // If still no member ID (e.g. Admin without member profile?), and none provided...
        // We cannot create a loan without a memberId due to Schema constraints.
        // We must error out or require it.
        if (!targetMemberId) {
            throw new Error('Member ID is required to start an application.')
        }
    }

    try {
        // Optimized: Get last created loan number (regardless of status)
        const lastLoan = await db.loan.findFirst({
            orderBy: { loanApplicationNumber: 'desc' },
            select: { loanApplicationNumber: true }
        })

        const nextNumber = getNextLoanNumber(lastLoan?.loanApplicationNumber)

        const loan = await db.loan.create({
            data: {
                loanApplicationNumber: nextNumber,
                memberId: targetMemberId,
                status: 'DRAFT',
                amount: 0,
                // Initialize default logic fields to 0 or safe defaults to avoid runtime validation errors if schema update is lagging
                current_balance: 0,
                outstandingBalance: 0,
                penalties: 0,
                memberSharesAtApplication: 0,
                grossQualifyingAmount: 0,
                processingFee: 0,
                insuranceFee: 0,
                shareCapitalDeduction: 0,
                existingLoanOffset: 0,
                totalDeductions: 0,
                netDisbursementAmount: 0,
                approvalVotes: [],
                applicationDate: new Date(), // Required by legacy schema validation
                interestRate: 0,
            }
        })

        return { success: true, loanId: loan.id }
    } catch (error) {
        console.error('Failed to start application:', error)
        throw new Error('Failed to start application')
    }
}

/**
 * Updates a draft loan (Auto-save)
 */
export async function updateLoanDraft(loanId: string, data: any) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Verify ownership (or Admin)
    const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
            member: {
                select: { userId: true }
            }
        }
    })
    if (!loan) throw new Error('Loan not found')

    // Get user role
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    // Strict ownership check: Only the loan owner or admins can update
    const isOwner = loan.member.userId === session.user.id
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    if (!isOwner && !isAdmin) {
        throw new Error('You can only update your own loan applications')
    }

    await db.loan.update({
        where: { id: loanId },
        data: {
            ...data,
            // Prevent status change via this action? 
            // Or allow if data includes it? 
            // Safer to strictly update valid draft fields.
            updatedAt: new Date()
        }
    })

    return { success: true }
}

export async function discardDraft(loanId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Get user role - only SUPER_ADMIN can delete loan applications
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    // Strict permission check: Only SUPER_ADMIN (System Admin) can delete
    if (user?.role !== 'SUPER_ADMIN') {
        throw new Error('Only System Administrators can delete loan applications')
    }

    // Verify loan exists before deleting
    const loan = await db.loan.findUnique({
        where: { id: loanId }
    })
    if (!loan) throw new Error('Loan not found')

    await db.loan.delete({
        where: { id: loanId }
    })

    return { success: true }
}
