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

    // STRICT: Check for existing drafts first
    const existingDraft = await db.loan.findFirst({
        where: {
            memberId: targetMemberId,
            status: { in: ['DRAFT', 'APPLICATION'] }
        },
        select: { id: true }
    })

    if (existingDraft) {
        return { success: true, loanId: existingDraft.id, message: 'Resumed existing draft' }
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
    const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(user?.role || '')

    if (!isOwner && !isAdmin) {
        throw new Error('Unauthorized: You can only update your own loan applications')
    }

    // Admin/Chairperson Restriction: Can ONLY edit exemptions if not the owner
    let updateData = data
    if (isAdmin && !isOwner) {
        // Filter data to ONLY allow feeExemptions
        // We assume 'data' might contain other fields from the form auto-save
        // We strictly pick only 'feeExemptions'
        if (!data.feeExemptions) {
            // If they tried to edit something else, we technically should block it, 
            // but auto-save might send everything. We just ignore non-exemption fields.
            // If ONLY non-exemption fields were sent, we do nothing or throw?
            // Let's safe-guard by only picking feeExemptions.
            updateData = {}
        } else {
            updateData = { feeExemptions: data.feeExemptions }
        }
    }

    if (Object.keys(updateData).length > 0) {
        await db.loan.update({
            where: { id: loanId },
            data: {
                ...updateData,
                updatedAt: new Date()
            }
        })
    }

    return { success: true }
}

export async function discardDraft(loanId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Get user role
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true } // Assuming 'role' is in User model
    })

    // Fetch loan to verify ownership
    const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
            member: {
                select: { userId: true }
            }
        }
    })

    if (!loan) throw new Error('Loan not found')

    // Permission Logic
    const isSystemAdmin = user?.role === 'SYSTEM_ADMIN'
    const isOwner = loan.member.userId === session.user.id

    // Allow deletion if System Admin OR Owner
    if (!isSystemAdmin && !isOwner) {
        throw new Error('Unauthorized: You can only delete your own loan applications.')
    }

    // Optional: Restrict Owners to only delete DRAFTs?
    // User request was "Only System Administrators..." implying they WERE blocked.
    // We will allow them to delete.
    // If business logic requires restricting status, we can add:
    // if (isOwner && loan.status !== 'DRAFT') throw new Error("Cannot delete submitted application");
    // For now, I'll unblock the user as requested.

    await db.loan.delete({
        where: { id: loanId }
    })

    return { success: true }
}
