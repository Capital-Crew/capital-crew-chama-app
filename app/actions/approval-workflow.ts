'use server'

import { revalidatePath } from 'next/cache'
import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, EntityType, AuditLogAction } from '@prisma/client'
import { withAudit } from '@/lib/with-audit'
import { MESSAGES } from '@/lib/constants/messages'

/**
 * Universal Workflow Workflow Transition Handler
 * @param entityType 'LOAN' | 'MEMBER' | 'EXPENSE'
 * @param entityId ID of the entity
 * @param action 'SEND' | 'CANCEL' | 'APPROVE' | 'REJECT'
 */
export async function handleWorkflowTransition(
    entityType: EntityType,
    entityId: string,
    action: 'SEND' | 'CANCEL' | 'APPROVE' | 'REJECT'
) {
    const session = await auth()
    if (!session?.user) return { error: MESSAGES.AUTH.UNAUTHORIZED }

    const actorId = session.user.id || ''
    const actorName = session.user.name || 'Unknown User'

    try {
        // 1. Switch Logic based on Entity Type
        if (entityType === 'LOAN') {
            return await handleLoanTransition(entityId, action as any, actorId, actorName || 'Unknown User')
        } else if (entityType as any === 'LOAN_NOTE') {
            return await handleLoanNoteTransition(entityId, action, actorId, actorName || 'Unknown User')
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
            throw new Error(MESSAGES.LOAN.NOT_FOUND)
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

export const handleLoanNoteTransition = withAudit(
    { actionType: AuditLogAction.LOAN_STATUS_CHANGED as any, domain: 'LOAN' as any, apiRoute: '/api/workflow/loan-note' },
    async (ctx, noteId: string, action: 'SEND' | 'CANCEL' | 'APPROVE' | 'REJECT', actorId: string, actorName: string) => {
        ctx.beginStep('Retrieve Loan Note');
        const note = await prisma.loanNote.findUnique({ where: { id: noteId } })
        if (!note) throw new Error(MESSAGES.NOTE.NOT_FOUND)
        ctx.captureBefore('LoanNote', note.id, note);
        ctx.endStep('Retrieve Loan Note');

        if (action === 'SEND') {
            if (!['DRAFT', 'REJECTED'].includes(note.status)) {
                throw new Error(MESSAGES.NOTE.INVALID_STATE)
            }

            const nextVersion = (note.version || 0) + 1

            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.loanNote.update({
                    where: { id: noteId },
                    data: {
                        status: 'PENDING_APPROVAL' as any,
                        version: nextVersion
                    }
                })

                // FETCH UNIVERSAL WORKFLOW ENGINE DEFINITION
                const workflow = await tx.workflowDefinition.findFirst({
                    where: { entityType: 'LOAN_NOTE' as any },
                    include: { stages: { orderBy: { stepNumber: 'asc' } } }
                });

                if (!workflow || workflow.stages.length === 0) {
                    throw new Error('No active workflow governance defined for Loan Notes.');
                }

                const firstStage = workflow.stages[0];

                // CREATE UNIVERSAL WORKFLOW REQUEST
                await tx.workflowRequest.create({
                    data: {
                        workflowId: workflow.id,
                        entityType: 'LOAN_NOTE' as any,
                        entityId: noteId,
                        requesterId: note.floaterId,
                        currentStageId: (workflow as any).stages[0].id,
                        status: 'PENDING' as any,
                        version: nextVersion
                    }
                })

                await tx.loanNoteAuditLog.create({
                    data: {
                        loanNoteId: noteId,
                        action: 'SUBMITTED',
                        performedBy: actorName,
                        notes: `Submitted for approval - Version ${nextVersion}`,
                        businessDate: new Date()
                    }
                })

                return { success: true }
            })

            revalidatePath('/loan-notes')
            revalidatePath(`/loan-notes/${noteId}`)
            return result
        }

        if (action === 'CANCEL') {
            if (note.status !== 'PENDING_APPROVAL') throw new Error(MESSAGES.NOTE.INVALID_STATE)

            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.loanNote.update({
                    where: { id: noteId },
                    data: {
                        status: 'DRAFT' as any,
                        cancellationCount: { increment: 1 }
                    }
                })

                const req = await tx.workflowRequest.findFirst({
                    where: { entityId: noteId, entityType: 'LOAN_NOTE' as any }
                })
                if (req) await tx.workflowRequest.delete({ where: { id: req.id } })

                return { success: true }
            })

            revalidatePath('/loan-notes')
            revalidatePath(`/loan-notes/${noteId}`)
            return result
        }

        if (action === 'APPROVE') {
            if (note.status !== 'PENDING_APPROVAL') throw new Error(MESSAGES.GOVERNANCE.REQ_NOT_FOUND)

            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.loanNote.update({
                    where: { id: noteId },
                    data: {
                        status: 'OPEN' as any, // Transition to LIVE for subscription
                    }
                })

                const req = await tx.workflowRequest.findFirst({
                    where: { entityId: noteId, entityType: 'LOAN_NOTE' as any, status: 'PENDING' }
                })

                if (req) {
                    await tx.workflowRequest.update({
                        where: { id: req.id },
                        data: { status: 'APPROVED' }
                    })

                    await tx.workflowAction.create({
                        data: {
                            requestId: req.id,
                            stageId: req.currentStageId || '',
                            actorId: actorId,
                            action: 'APPROVED',
                            notes: 'Board Approved'
                        }
                    })
                }

                await tx.loanNoteAuditLog.create({
                    data: {
                        loanNoteId: noteId,
                        action: 'APPROVED',
                        performedBy: actorName,
                        notes: 'Board signature confirmed. Note is now OPEN.',
                        businessDate: new Date()
                    }
                })

                return { success: true }
            })

            revalidatePath('/loan-notes')
            revalidatePath(`/loan-notes/${noteId}`)
            return result
        }

        if (action === 'REJECT') {
            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.loanNote.update({
                    where: { id: noteId },
                    data: { status: 'REJECTED' as any }
                })

                const req = await tx.workflowRequest.findFirst({
                    where: { entityId: noteId, entityType: 'LOAN_NOTE' as any, status: 'PENDING' }
                })

                if (req) {
                    await tx.workflowRequest.update({
                        where: { id: req.id },
                        data: { status: 'REJECTED' }
                    })

                    await tx.workflowAction.create({
                        data: {
                            requestId: req.id,
                            stageId: req.currentStageId || '',
                            actorId: actorId,
                            action: 'REJECTED',
                            notes: 'Board Rejected'
                        }
                    })
                }

                return { success: true }
            })

            revalidatePath('/loan-notes')
            revalidatePath(`/loan-notes/${noteId}`)
            return result
        }
    }
)


