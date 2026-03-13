'use server'

import { revalidatePath } from 'next/cache'
import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, EntityType, ApprovalAction, LoanStatus, AuditLogAction } from '@prisma/client'
import { withAudit } from '@/lib/with-audit'

/**
 * Universal Workflow Workflow Transition Handler
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

export const handleLoanTransition = withAudit(
    { actionType: AuditLogAction.LOAN_STATUS_CHANGED, domain: 'LOAN', apiRoute: '/api/workflow/loan' },
    async (ctx, loanId: string, action: 'SEND' | 'CANCEL', actorId: string, actorName: string) => {
        ctx.beginStep('Retrieve Loan Record');
        const loan = await prisma.loan.findUnique({ where: { id: loanId } })
        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error('Loan not found')
        }
        ctx.captureBefore('Loan', loan.id, loan);
        ctx.endStep('Retrieve Loan Record');

        // SEND REQUEST (Application -> Pending)
        if (action === 'SEND') {
            ctx.beginStep('Validate Loan Status');
            if (loan.status !== 'APPLICATION') {
                ctx.setErrorCode('INVALID_STATUS');
                throw new Error('Loan must be in APPLICATION stage to send.')
            }
            ctx.endStep('Validate Loan Status');

            const nextVersion = (loan.submissionVersion || 0) + 1

            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                ctx.beginStep('Update Loan Status');
                // Update Loan
                await tx.loan.update({
                    where: { id: loanId },
                    data: {
                        status: 'PENDING_APPROVAL',
                        applicationDate: new Date(),
                        submissionVersion: nextVersion
                    }
                })
                ctx.endStep('Update Loan Status');

                ctx.beginStep('Create/Update Approval Request');
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
                ctx.endStep('Create/Update Approval Request');

                ctx.beginStep('Log Approval History');
                // Log History
                await tx.approvalHistory.create({
                    data: {
                        entityType: 'LOAN',
                        entityId: loanId,
                        actorUsername: actorName,
                        actorId: actorId,
                        action: 'SUBMITTED',
                        metadata: { version: nextVersion, amount: loan.amount } as any
                    }
                })
                ctx.endStep('Log Approval History');

                ctx.beginStep('Send Notification');
                // Create Notification
                await tx.notification.create({
                    data: {
                        memberId: loan.memberId,
                        type: 'SYSTEM_UPDATE',
                        message: `Loan Application ${loan.loanApplicationNumber} submitted.`,
                        loanId: loanId
                    }
                })
                ctx.endStep('Send Notification');

                return { success: true }
            })

            const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });
            if (updatedLoan) ctx.captureAfter(updatedLoan);

            revalidatePath('/loans')
            revalidatePath(`/loans/${loanId}`)
            return result
        }

        // CANCEL REQUEST (Pending/Application -> Application/Cancelled)
        if (action === 'CANCEL') {
            ctx.beginStep('Validate Cancellation');
            if (!['APPLICATION', 'PENDING_APPROVAL'].includes(loan.status)) {
                ctx.setErrorCode('INVALID_STATUS');
                throw new Error('Cannot cancel a processed loan.')
            }
            ctx.endStep('Validate Cancellation');

            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                ctx.beginStep('Revert Loan Status');
                // Revert Status to APPLICATION (Editable)
                await tx.loan.update({
                    where: { id: loanId },
                    data: {
                        status: 'APPLICATION', // Back to Draft
                        approvalVotes: [],
                        cancellationCount: { increment: 1 }
                    }
                })
                ctx.endStep('Revert Loan Status');

                ctx.beginStep('Remove Approval Request');
                // Remove from approval queue
                const existingReq = await tx.approvalRequest.findFirst({
                    where: { referenceId: loanId, type: 'LOAN' }
                })
                if (existingReq) {
                    await tx.approvalRequest.delete({ where: { id: existingReq.id } })
                }
                ctx.endStep('Remove Approval Request');

                ctx.beginStep('Log Approval History');
                // Log History
                await tx.approvalHistory.create({
                    data: {
                        entityType: 'LOAN',
                        entityId: loanId,
                        actorUsername: actorName,
                        actorId: actorId,
                        action: 'CANCELLED',
                        metadata: { fromStatus: loan.status } as any
                    }
                })
                ctx.endStep('Log Approval History');

                return { success: true }
            })

            const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });
            if (updatedLoan) ctx.captureAfter(updatedLoan);

            revalidatePath('/loans')
            revalidatePath(`/loans/${loanId}`)
            return result
        }
    }
)

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


