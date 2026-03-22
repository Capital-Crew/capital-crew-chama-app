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
import { AccountingService } from '@/lib/services/AccountingService'


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


export async function getActiveLoansByMember(memberId: string): Promise<Serialized<any>> {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // 2. Call service
    return serializeFinancials(await LoanService.getActiveLoansByMember(memberId))
}


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
            },
            transactions: {
                orderBy: { postedAt: 'desc' },
                take: 50
            }
        }
    })

    if (!loan) return null

    // Serialize Decimal fields to numbers for Client Component
    return serializeFinancials(loan)
}



export async function getOperationalMetricsReport(startDate: string, endDate: string): Promise<Serialized<any>> {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // 2. Call service
    const metrics = await AccountingService.getOperationalMetrics(
        new Date(startDate),
        new Date(endDate)
    )

    // 3. Serialize
    return serializeFinancials(metrics)
}


export async function getLoanTransactionDetails(transactionId: string): Promise<Serialized<any>> {
    const transaction = await db.loanTransaction.findUnique({
        where: { id: transactionId },
        include: {
            loan: {
                include: {
                    member: {
                        include: {
                            user: true
                        }
                    },
                    loanProduct: true
                }
            }
        }
    });

    if (!transaction) return null;

    // 2. Fetch the associated GL Entries (via LedgerTransaction)
    // The link is usually via referenceId (strict) or externalReferenceId (legacy)
    const ledgerTx = await db.ledgerTransaction.findFirst({
        where: {
            OR: [
                // Primary Link: Ledger Transaction ID is stored in LoanTransaction.referenceId
                { id: transaction.referenceId || undefined },
                // Secondary Link: Loan Transaction ID is stored in LedgerTransaction.externalReferenceId
                { externalReferenceId: transactionId }
            ]
        },
        include: {
            ledgerEntries: {
                include: {
                    ledgerAccount: true
                }
            }
        }
    });

    // 3. Map GL Entries based on GLEntry interface
    let glEntries: any[] = [];
    if (ledgerTx && ledgerTx.ledgerEntries) {
        glEntries = ledgerTx.ledgerEntries.map(entry => ({
            id: entry.id,
            transactionId: transaction.id,
            glAccountNo: entry.ledgerAccount?.code || entry.ledgerAccountId,
            glAccountName: entry.ledgerAccount?.name || 'Unknown Account',
            debitAmount: Number(entry.debitAmount),
            creditAmount: Number(entry.creditAmount),
            runningBalance: 0
        }));
    }

    // 4. Combine and Return
    return serializeFinancials({
        ...transaction,
        entryType: transaction.type, // Enum match?
        postingDate: transaction.postedAt,
        glEntries,
        user: transaction.loan.member.user, // Hoist user
        isReversal: transaction.isReversed,
        // Ensure reference is passed correctly for UI
        reference: transaction.referenceId || transaction.externalReferenceId
    });
}
