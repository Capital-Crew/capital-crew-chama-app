'use server'

import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { AccountingEngine, getMemberWalletBalance } from "@/lib/accounting/AccountingEngine"
import { getSystemMappingsDict } from "@/app/actions/system-accounting"
import { WalletService } from "@/lib/services/WalletService"
import { withAudit } from "@/lib/with-audit"
import { AuditLogAction } from "@prisma/client"
import { withIdempotency } from "@/lib/idempotency"

export type WelfareRequisitionFormData = {
    welfareTypeId: string
    memberId: string
    amount: number
    reason: string
    customFieldData: Record<string, any>
    idempotencyKey?: string
}


export const createWelfareRequisition = withAudit(
    { actionType: AuditLogAction.WELFARE_REQUISITION_CREATED, domain: 'WELFARE', apiRoute: '/api/welfare/requisitions/create' },
    async (ctx, data: WelfareRequisitionFormData) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: 'Unauthorized' }
        }

        const allowedRoles = ['CHAIRPERSON', 'SECRETARY', 'TREASURER', 'SYSTEM_ADMIN']
        if (!allowedRoles.includes(session.user.role || '')) {
            ctx.setErrorCode('FORBIDDEN');
            return { success: false, error: 'Access Denied: Only Executives can create welfare requisitions.' }
        }
        ctx.endStep('Verify Authorization');

        const businessLogic = async () => {
            try {
                ctx.beginStep('Validate and Fetch Member');
                if (data.amount <= 0) {
                    ctx.setErrorCode('INVALID_AMOUNT');
                    return { success: false, error: 'Amount must be greater than zero' }
                }

                let beneficiaryName = ''
                if (data.memberId) {
                    const member = await prisma.member.findUnique({
                        where: { id: data.memberId },
                        select: { name: true }
                    })
                    if (member) beneficiaryName = member.name
                }
                ctx.endStep('Validate and Fetch Member');

                ctx.beginStep('Generate Requisition Number');
                const date = new Date()
                const yearMonth = date.toISOString().slice(0, 7).replace('-', '')

                const count = await prisma.welfareRequisition.count({
                    where: {
                        requisitionNumber: {
                            startsWith: `WR-${yearMonth}`
                        }
                    }
                })

                const sequence = (count + 1).toString().padStart(3, '0')
                const requisitionNumber = `WR-${yearMonth}-${sequence}`
                ctx.endStep('Generate Requisition Number');

                ctx.beginStep('Create Requisition');
                const requisition = await prisma.welfareRequisition.create({
                    data: {
                        requisitionNumber,
                        welfareTypeId: data.welfareTypeId,
                        memberId: data.memberId,
                        beneficiaryName: beneficiaryName || 'Unknown',
                        amount: data.amount,
                        reason: data.reason,
                        customFieldData: data.customFieldData,
                        status: 'PENDING',
                        createdById: session.user.id,
                        journeyEvents: {
                            create: {
                                eventType: 'CREATED',
                                description: `Requisition created by ${session.user.name || 'Admin'} for ${beneficiaryName}`,
                                actorId: session.user.id
                            }
                        }
                    }
                })
                ctx.captureAfter(requisition);
                ctx.endStep('Create Requisition');

                revalidatePath('/welfare')
                return { success: true, data: requisition }
            } catch (error: any) {
                ctx.setErrorCode('DATABASE_ERROR');
                return { success: false, error: error.message }
            }
        }

        if (data.idempotencyKey) {
            return await withIdempotency({
                key: data.idempotencyKey,
                path: 'createWelfareRequisition',
                businessLogic
            })
        }

        return await businessLogic()
    }
);

export async function getWelfareRequisitions(status?: string, memberId?: string) {
    try {
        const where: any = {}
        if (status && status !== 'ALL') where.status = status
        if (memberId) where.memberId = memberId

        const requisitions = await prisma.welfareRequisition.findMany({
            where,
            include: {
                welfareType: true,
                member: {
                    select: { name: true, memberNumber: true }
                },
                createdBy: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: requisitions }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getWelfareRequisitionById(id: string) {
    try {
        const requisition = await prisma.welfareRequisition.findUnique({
            where: { id },
            include: {
                welfareType: {
                    include: {
                        customFields: {
                            orderBy: { displayOrder: 'asc' }
                        }
                    }
                },
                member: true,
                approvals: {
                    include: {
                        approver: {
                            select: { name: true, memberNumber: true }
                        }
                    },
                    orderBy: { timestamp: 'desc' }
                },
                journeyEvents: {
                    orderBy: { timestamp: 'desc' }
                },
                createdBy: {
                    select: { name: true }
                }
            }
        })

        if (!requisition) {
            return { success: false, error: 'Requisition not found' }
        }

        return { success: true, data: requisition }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function cancelWelfareRequisition(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    try {
        const requisition = await prisma.welfareRequisition.findUnique({
            where: { id }
        })

        if (!requisition) return { success: false, error: 'Requisition not found' }
        if (requisition.status !== 'PENDING') {
            return { success: false, error: 'Only pending requisitions can be cancelled' }
        }

        await prisma.welfareRequisition.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                journeyEvents: {
                    create: {
                        eventType: 'CANCELLED',
                        description: `Cancelled by ${session.user.name}`,
                        actorId: session.user.id
                    }
                }
            }
        })

        revalidatePath(`/welfare`)
        revalidatePath(`/welfare/${id}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}


export const submitWelfareApproval = withAudit(
    { actionType: AuditLogAction.WELFARE_STATUS_CHANGED, domain: 'WELFARE', apiRoute: '/api/welfare/requisitions/approve' },
    async (ctx, requisitionId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: 'Unauthorized' }
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Resolve Approver Identity');
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { member: true }
            })

            if (!user?.member) {
                ctx.setErrorCode('MEMBER_NOT_FOUND');
                return { success: false, error: 'User is not a member' }
            }
            const approverId = user.member.id
            ctx.endStep('Resolve Approver Identity');

            ctx.beginStep('Fetch Requisition and Validate');
            const requisition = await prisma.welfareRequisition.findUnique({
                where: { id: requisitionId }
            })

            if (!requisition) {
                ctx.setErrorCode('REQUISITION_NOT_FOUND');
                return { success: false, error: 'Requisition not found' }
            }
            if (requisition.status !== 'PENDING') {
                ctx.setErrorCode('INVALID_STATUS');
                return { success: false, error: 'Requisition is not pending approval' }
            }
            if (requisition.memberId === approverId) {
                ctx.setErrorCode('SELF_APPROVAL_FORBIDDEN');
                return { success: false, error: 'Cannot approve your own requisition' }
            }

            const existingVote = await prisma.welfareApproval.findFirst({
                where: { requisitionId, approverId }
            })

            if (existingVote) {
                ctx.setErrorCode('ALREADY_VOTED');
                return { success: false, error: 'You have already voted on this requisition' }
            }
            ctx.captureBefore('Requisition', requisitionId, requisition);
            ctx.endStep('Fetch Requisition and Validate');

            ctx.beginStep('Record Vote and Check Consensus');
            await prisma.welfareApproval.create({
                data: {
                    requisitionId,
                    approverId,
                    decision,
                    notes
                }
            })

            const settings = await prisma.saccoSettings.findFirst()
            const requiredApprovals = settings?.requiredWelfareApprovals || 2

            const votes = await prisma.welfareApproval.findMany({
                where: { requisitionId }
            })

            const approvalCount = votes.filter((v: any) => v.decision === 'APPROVED').length
            const rejectCount = votes.filter((v: any) => v.decision === 'REJECTED').length

            let newStatus = 'PENDING'
            let eventDescription = `Vote: ${decision} by ${user.member.name}`

            if (rejectCount > 0) {
                newStatus = 'REJECTED'
                eventDescription = `Rejected by ${user.member.name}`
            } else if (approvalCount >= requiredApprovals) {
                newStatus = 'APPROVED'
                eventDescription = `Approved (Threshold Met: ${approvalCount}/${requiredApprovals})`
            }

            if (newStatus !== 'PENDING') {
                const updated = await prisma.welfareRequisition.update({
                    where: { id: requisitionId },
                    data: {
                        status: newStatus as any,
                        journeyEvents: {
                            create: {
                                eventType: newStatus as any,
                                description: eventDescription,
                                actorId: session.user.id
                            }
                        }
                    }
                })
                ctx.captureAfter(updated);
            } else {
                await prisma.welfareJourneyEvent.create({
                    data: {
                        requisitionId,
                        eventType: 'SUBMITTED',
                        description: `Vote: ${decision} by ${user.member.name}`,
                        actorId: session.user.id
                    }
                })
            }
            ctx.endStep('Record Vote and Check Consensus');

            revalidatePath(`/welfare/${requisitionId}`)
            return { success: true }

        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            return { success: false, error: error.message }
        }
    }
);


export const disburseWelfare = withAudit(
    { actionType: AuditLogAction.WELFARE_DISBURSED, domain: 'WELFARE', apiRoute: '/api/welfare/requisitions/disburse' },
    async (ctx, requisitionId: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: 'Unauthorized' }
        }

        const userRole = session.user.role
        if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(userRole || '')) {
            // Permission check can be strict here if needed
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Fetch Requisition and Validate');
            const requisition = await prisma.welfareRequisition.findUnique({
                where: { id: requisitionId },
                include: { welfareType: true, member: true }
            })

            if (!requisition) {
                ctx.setErrorCode('REQUISITION_NOT_FOUND');
                return { success: false, error: 'Requisition not found' }
            }
            if (requisition.status !== 'APPROVED') {
                ctx.setErrorCode('INVALID_STATUS');
                return { success: false, error: 'Requisition is not approved' }
            }
            if (requisition.status === 'DISBURSED') {
                ctx.setErrorCode('ALREADY_DISBURSED');
                return { success: false, error: 'Already disbursed' }
            }
            ctx.captureBefore('Requisition', requisitionId, requisition);
            ctx.endStep('Fetch Requisition and Validate');

            ctx.beginStep('Check Fund Balance');
            const settings = await prisma.saccoSettings.findFirst()
            const currentBalance = Number(settings?.welfareCurrentBalance || 0)
            const amount = Number(requisition.amount)

            if (currentBalance < amount) {
                ctx.setErrorCode('INSUFFICIENT_FUNDS');
                return { success: false, error: `Insufficient Welfare Fund Balance. Available: ${currentBalance}` }
            }
            ctx.endStep('Check Fund Balance');

            ctx.beginStep('Post Financial Transaction');
            const welfareAccount = await prisma.ledgerAccount.findUnique({
                where: { id: requisition.welfareType.glAccountId }
            })

            if (!welfareAccount) {
                ctx.setErrorCode('ACCOUNT_NOT_FOUND');
                return { success: false, error: 'Welfare GL Account not found' }
            }

            const wallet = await WalletService.createWallet(requisition.memberId)

            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'WELFARE_DISBURSEMENT',
                referenceId: requisition.id,
                description: `Welfare Disbursement: ${requisition.welfareType.name} - ${requisition.member.name}`,
                lines: [
                    {
                        accountCode: welfareAccount.code,
                        debitAmount: amount,
                        creditAmount: 0,
                        description: `Disbursement: ${requisition.reason}`
                    },
                    {
                        accountCode: wallet.accountRef,
                        debitAmount: 0,
                        creditAmount: amount,
                        description: `Welfare deposit to wallet`
                    }
                ],
                createdBy: session.user.id,
                createdByName: session.user.name || 'Admin'
            })
            ctx.endStep('Post Financial Transaction', { jeId: journalEntry.id });

            ctx.beginStep('Update Balances and Status');
            await prisma.saccoSettings.update({
                where: { id: settings?.id },
                data: {
                    welfareCurrentBalance: { decrement: amount }
                }
            })

            await prisma.welfareFundTransaction.create({
                data: {
                    type: 'DISBURSEMENT',
                    amount: amount,
                    description: `Disbursement to ${requisition.member.name} (${requisition.requisitionNumber})`,
                    balanceAfter: currentBalance - amount,
                    requisitionId: requisition.id,
                    createdById: session.user.id
                }
            })

            const updated = await prisma.welfareRequisition.update({
                where: { id: requisitionId },
                data: {
                    status: 'DISBURSED',
                    disbursedAt: new Date(),
                    journalEntryId: journalEntry.id,
                    journeyEvents: {
                        create: {
                            eventType: 'DISBURSED',
                            description: `Disbursed KES ${amount} to wallet ${wallet.accountRef}`,
                            actorId: session.user.id
                        }
                    }
                }
            })
            ctx.captureAfter(updated);
            ctx.endStep('Update Balances and Status');

            revalidatePath(`/welfare`)
            revalidatePath(`/welfare/${requisitionId}`)
            return { success: true }
        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            return { success: false, error: error.message }
        }
    }
);
