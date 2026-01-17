/**
 * Loan Actions (Thin Controllers)
 * 
 * These are Next.js Server Actions that handle:
 * - Authentication/Authorization
 * - Input parsing and validation
 * - Calling the LoanService
 * - Returning user-friendly responses
 * - Cache revalidation
 * 
 * NO business logic should live here.
 */

'use server'

import { auth } from '@/auth'
import { LoanService } from '@/services/loan-service'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { serializeLoan } from '@/lib/serializers'

// ========================================
// REPAYMENT ACTION
// ========================================

import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
// ... existing imports ...

// ... existing code ...

export async function addLoanRepayment(input: {
    memberId: string
    loanId: string
    amount: number
    description: string
}): Promise<Serialized<any>> {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // 2. Get user details for audit
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    // 3. Call service (pure business logic)
    const result = await LoanService.processRepayment({
        loanId: input.loanId,
        amount: input.amount,
        description: input.description,
        userId: session.user.id,
        userName: user?.member?.name || session.user.name || 'System'
    })

    // 4. Create audit log
    await db.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'WALLET_TRANSACTION_CREATED',
            details: `Loan repayment: ${input.loanId} - KES ${input.amount} ${result.isFullyPaid ? '(LOAN CLEARED)' : ''}`
        }
    })

    // 5. Revalidate UI cache
    revalidatePath('/wallet')
    revalidatePath('/loans')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath(`/members/${input.memberId}`)
    revalidatePath(`/loans/${input.loanId}`)

    return serializeFinancials(result)
}

// ========================================
// GET ACTIVE LOANS ACTION
// ========================================

export async function getActiveLoansByMember(memberId: string): Promise<Serialized<any>> {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // 2. Call service
    return serializeFinancials(await LoanService.getActiveLoansByMember(memberId))
}

// ========================================
// GET LOAN DETAILS ACTION
// ========================================

export async function getLoanDetails(loanId: string): Promise<Serialized<any>> {
    const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
            member: {
                include: {
                    contactInfo: true
                }
            },
            loanProduct: true,
            // repaymentSchedule is a scalar JSON field, so it's included by default
            walletTransactions: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    })

    if (!loan) return null

    // Serialize Decimal fields to numbers for Client Component
    return serializeFinancials(loan)
}


