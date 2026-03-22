'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { ApprovalStatus, TransferStatus } from '@prisma/client'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { withIdempotency } from '@/lib/idempotency'

export async function createTransferRequest(data: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    description: string;
    idempotencyKey?: string;
}) {
    const session = await auth()

    // Strict Admin Check
    const allowedRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN']
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
        return { error: 'Unauthorized: Only administrators can initiate transfers.' }
    }

    if (data.amount <= 0) {
        return { error: 'Amount must be greater than zero.' }
    }

    if (data.sourceAccountId === data.destinationAccountId) {
        return { error: 'Source and Destination accounts cannot be the same.' }
    }

    const businessLogic = async () => {
        const result = await db.$transaction(async (tx) => {
            // Fetch source account to determine its type
            const sourceAccount = await tx.ledgerAccount.findUnique({
                where: { id: data.sourceAccountId },
                select: { type: true, code: true, name: true }
            })

            if (!sourceAccount) {
                throw new Error('Source account not found')
            }

            const debitNormalTypes = ['ASSET', 'EXPENSE']
            const isSourceDebitNormal = debitNormalTypes.includes(sourceAccount.type)

            let debitAccountId: string
            let creditAccountId: string

            if (isSourceDebitNormal) {
                creditAccountId = data.sourceAccountId
                debitAccountId = data.destinationAccountId
            } else {
                debitAccountId = data.sourceAccountId
                creditAccountId = data.destinationAccountId
            }

            // 1. Create Request with intelligently assigned debit/credit
            const request = await tx.transferRequest.create({
                data: {
                    requesterId: session.user.id!,
                    debitAccountId,
                    creditAccountId,
                    amount: data.amount,
                    description: data.description,
                    status: TransferStatus.PENDING
                }
            })

            // 2. Auto-Approve by Requester (Maker Consent)
            await tx.transferApproval.create({
                data: {
                    transferRequestId: request.id,
                    approverId: session.user.id!,
                    status: ApprovalStatus.APPROVED,
                    notes: 'Request Creator'
                }
            })

            return { success: true, id: request.id }
        })

        revalidatePath('/accounting/transfers')
        revalidatePath('/accounts')
        return result
    }

    try {
        if (data.idempotencyKey) {
            return await withIdempotency({
                key: data.idempotencyKey,
                path: 'createTransferRequest',
                businessLogic
            })
        }
        return await businessLogic()
    } catch (error: any) {
        return { error: error.message || 'Failed to create transfer request' }
    }
}


export async function approveTransfer(requestId: string, notes?: string) {
    const session = await auth()

    // Strict Admin Check
    const allowedRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN']
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
        return { error: 'Unauthorized: Only administrators can approve transfers.' }
    }

    try {
        const result = await db.$transaction(async (tx) => {
            const request = await tx.transferRequest.findUnique({
                where: { id: requestId },
                include: { approvals: true }
            })

            if (!request) throw new Error('Request not found')
            if (request.status !== TransferStatus.PENDING) throw new Error('Request is not pending')

            // Check if already voted
            const existingVote = request.approvals.find(a => a.approverId === session.user.id)
            if (existingVote) {
                throw new Error('You have already voted on this request.')
            }

            // Record Approval
            await tx.transferApproval.create({
                data: {
                    transferRequestId: requestId,
                    approverId: session.user.id!,
                    status: ApprovalStatus.APPROVED,
                    notes: notes
                }
            })


            // Re-fetch approvals to be safe? Or validation logic:
            // Previous approvals + Current one.
            const totalApprovals = request.approvals.filter(a => a.status === ApprovalStatus.APPROVED).length + 1

            if (totalApprovals >= 2) {
                // EXECUTE TRANSACTION
                // 1. Post to Ledger
                const je = await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'MANUAL_ADJUSTMENT',
                    referenceId: request.id,
                    description: `Transfer Executed: ${request.description}`,
                    notes: `Approved by ${totalApprovals} admins.`,
                    createdBy: session.user.id!,
                    createdByName: session.user.name || 'Admin',
                    lines: [
                        {
                            accountId: request.debitAccountId,
                            debitAmount: Number(request.amount),
                            creditAmount: 0,
                            description: request.description
                        },
                        {
                            accountId: request.creditAccountId,
                            debitAmount: 0,
                            creditAmount: Number(request.amount),
                            description: request.description
                        }
                    ]
                }, tx as any) // Type cast if needed for transaction client

                // 2. Update Request Status
                await tx.transferRequest.update({
                    where: { id: requestId },
                    data: {
                        status: TransferStatus.EXECUTED,
                        ledgerEntryId: je.id
                    }
                })
            } else {
                // Just update status to indicate progress? 
                // Currently status is PENDING until EXECUTED.
            }

            return { success: true }
        })

        revalidatePath('/accounting/transfers')
        revalidatePath('/accounts') // Ensure balances update!
        return result

    } catch (error: any) {
        return { error: error.message || 'Failed to approve transfer' }
    }
}


export async function rejectTransfer(requestId: string, notes: string) {
    const session = await auth()
    // Strict Admin Check
    const allowedRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN']
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
        return { error: 'Unauthorized' }
    }

    try {
        await db.transferRequest.update({
            where: { id: requestId },
            data: {
                status: TransferStatus.REJECTED
            }
        })

        await db.transferApproval.create({
            data: {
                transferRequestId: requestId,
                approverId: session.user.id!,
                status: ApprovalStatus.REJECTED,
                notes
            }
        })

        revalidatePath('/accounting/transfers')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

/**
 * Fetch all transfer requests (Pending & History)
 */
export async function getTransferRequests() {
    const session = await auth()
    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    const [pendingRaw, historyRaw] = await Promise.all([
        db.transferRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                requester: { select: { name: true } },
                debitAccount: true,
                creditAccount: true,
                approvals: true
            },
            orderBy: { createdAt: 'desc' }
        }),
        db.transferRequest.findMany({
            where: { status: { in: ['EXECUTED', 'REJECTED'] } },
            include: {
                requester: { select: { name: true } },
                debitAccount: true,
                creditAccount: true,
                approvals: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50
        })
    ])

    const serializeTransfer = (t: any) => ({
        ...t,
        amount: Number(t.amount),
        debitAccount: { ...t.debitAccount, balance: Number(t.debitAccount.balance) },
        creditAccount: { ...t.creditAccount, balance: Number(t.creditAccount.balance) }
    })

    return {
        pending: pendingRaw.map(serializeTransfer),
        history: historyRaw.map(serializeTransfer)
    }
}
