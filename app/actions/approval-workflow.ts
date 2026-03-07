'use server'

import { revalidatePath } from 'next/cache'
import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, EntityType, ApprovalAction, LoanStatus } from '@prisma/client'

/**
 * Universal Workflow Transition Handler
 * @param entityType 'LOAN' | 'MEMBER' | 'EXPENSE'
 * @param entityId ID of the entity
 * @param action 'SEND' | 'CANCEL'
 */
export async function handleWorkflowTransition(
    entityType: EntityType,
    entityId: string,
    action: 'SEND' | 'CANCEL'
) {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    const actorId = session.user.id || ''
    const actorName = session.user.name || 'Unknown User'

    try {
        // 1. Switch Logic based on Entity Type
        if (entityType === 'LOAN') {
            return await handleLoanTransition(entityId, action, actorId, actorName || 'Unknown User')
        } else if (entityType === 'MEMBER') {
            return { error: 'Member workflow not yet implemented' }
        } else if (entityType === 'WELFARE') {
            return { error: 'Welfare workflow not yet implemented' }
        } else if (entityType === 'ACCOUNT_TRANSFER') {
            return { error: 'Transfer workflow not yet implemented' }
        } else {
            return { error: 'Unknown Entity Type' }
        }
    } catch (error: any) {
        return { error: error.message || 'Workflow failed' }
    }
}

async function handleLoanTransition(loanId: string, action: 'SEND' | 'CANCEL', actorId: string, actorName: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return { error: 'Loan not found' }

    // SEND REQUEST (Application -> Pending)
    if (action === 'SEND') {
        if (loan.status !== 'APPLICATION') {
            return { error: 'Loan must be in APPLICATION stage to send.' }
        }

        // Validate Eligibility (Reuse existing logic or simplified check)
        // ideally: const eligibility = await checkLoanEligibility(loan.memberId)

        const nextVersion = (loan.submissionVersion || 0) + 1

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update Loan
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'PENDING_APPROVAL',
                    applicationDate: new Date(),
                    submissionVersion: nextVersion
                }
            })

            // Ensure ApprovalRequest exists
            const loanWithDetails = await tx.loan.findUnique({
                where: { id: loanId },
                include: {
                    member: { select: { id: true, name: true, memberNumber: true } },
                    loanProduct: { select: { name: true } }
                }
            })

            if (loanWithDetails) {
                const existingReq = await tx.approvalRequest.findFirst({
                    where: { referenceId: loanId, type: 'LOAN' }
                })

                const description = `${loanWithDetails.loanProduct?.name || 'Loan'} - ${loanWithDetails.member.name} (${loanWithDetails.member.memberNumber})`

                if (existingReq) {
                    await tx.approvalRequest.update({
                        where: { id: existingReq.id },
                        data: {
                            status: 'PENDING',
                            description,
                            amount: loanWithDetails.amount,
                            requesterName: loanWithDetails.member.name
                        }
                    })
                } else {
                    await tx.approvalRequest.create({
                        data: {
                            type: 'LOAN',
                            referenceId: loanId,
                            referenceTable: 'Loan',
                            requesterId: loanWithDetails.memberId,
                            requesterName: loanWithDetails.member.name,
                            description,
                            amount: loanWithDetails.amount,
                            status: 'PENDING',
                            requiredPermission: 'APPROVE_LOANS'
                        }
                    })
                }
            }



            // Log History
            await tx.approvalHistory.create({
                data: {
                    entityType: 'LOAN',
                    entityId: loanId,
                    actorUsername: actorName,
                    actorId: actorId,
                    action: 'SUBMITTED',
                    metadata: { version: nextVersion, amount: loan.amount }
                }
            })

            // Create Notification
            await tx.notification.create({
                data: {
                    memberId: loan.memberId, // Notify the member themselves? Or admins?
                    // Usually this notifies ADMINS. For now, system log.
                    type: 'SYSTEM_UPDATE',
                    message: `Loan Application ${loan.loanApplicationNumber} submitted.`,
                    loanId: loanId
                }
            })
        })

        revalidatePath('/loans')
        revalidatePath(`/loans/${loanId}`)
        return { success: true }
    }

    // CANCEL REQUEST (Pending/Application -> Application/Cancelled)
    if (action === 'CANCEL') {
        // Allow cancelling even if Draft (just to log it) or Pending
        // If Draft, it just stays Draft but maybe clears fields? 
        // User request: "Cancel Request" usually withdraws a PENDING one back to DRAFT (Application).

        if (!['APPLICATION', 'PENDING_APPROVAL'].includes(loan.status)) {
            return { error: 'Cannot cancel a processed loan.' }
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Revert Status to APPLICATION (Editable)
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'APPLICATION', // Back to Draft
                    // Start fresh approval votes
                    approvalVotes: [],
                    cancellationCount: { increment: 1 }
                }
            })

            // Remove from approval queue
            const existingReq = await tx.approvalRequest.findFirst({
                where: { referenceId: loanId, type: 'LOAN' }
            })
            if (existingReq) {
                await tx.approvalRequest.delete({ where: { id: existingReq.id } })
            }

            // Log History
            await tx.approvalHistory.create({
                data: {
                    entityType: 'LOAN',
                    entityId: loanId,
                    actorUsername: actorName,
                    actorId: actorId,
                    action: 'CANCELLED',
                    metadata: { fromStatus: loan.status }
                }
            })
        })

        revalidatePath('/loans')
        revalidatePath(`/loans/${loanId}`)
        return { success: true }
    }
}

/**
 * Fetch Approval History
 */
export async function getApprovalHistory(entityType: EntityType, entityId: string) {
    const history = await prisma.approvalHistory.findMany({
        where: { entityType, entityId },
        orderBy: { timestamp: 'desc' }
    })
    return history
}
