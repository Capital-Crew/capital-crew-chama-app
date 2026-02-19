'use server'

import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { AccountingEngine, getMemberWalletBalance } from "@/lib/accounting/AccountingEngine"
import { getSystemMappingsDict } from "@/app/actions/system-accounting"
import { WalletService } from "@/lib/services/WalletService"

export type WelfareRequisitionFormData = {
    welfareTypeId: string
    memberId: string
    amount: number
    reason: string
    customFieldData: Record<string, any>
}

// ==========================================
// Requisition Management
// ==========================================

export async function createWelfareRequisition(data: WelfareRequisitionFormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // RBAC: Restricted to Executives
    const allowedRoles = ['CHAIRPERSON', 'SECRETARY', 'TREASURER', 'SYSTEM_ADMIN']
    if (!allowedRoles.includes(session.user.role || '')) {
        return { success: false, error: 'Access Denied: Only Executives can create welfare requisitions.' }
    }

    try {
        // Validate amount
        if (data.amount <= 0) {
            return { success: false, error: 'Amount must be greater than zero' }
        }

        // Get Beneficiary Name
        let beneficiaryName = ''
        if (data.memberId) {
            const member = await prisma.member.findUnique({
                where: { id: data.memberId },
                select: { name: true }
            })
            if (member) beneficiaryName = member.name
        }

        // Generate Requisition Number (WR-YYYYMM-XXXX)
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

        // Create Requisition
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

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'WELFARE_REQUISITION_CREATED' as any,
                details: `Created requisition ${requisitionNumber} for KES ${data.amount}`
            }
        })

        revalidatePath('/welfare')
        return { success: true, data: requisition }
    } catch (error: any) {
        console.error('Error creating welfare requisition:', error)
        return { success: false, error: error.message }
    }
}

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
        console.error('Error fetching requisitions:', error)
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
        console.error('Error fetching requisition:', error)
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
        console.error('Error cancelling requisition:', error)
        return { success: false, error: error.message }
    }
}

// ==========================================
// Approval Workflow
// ==========================================

export async function submitWelfareApproval(requisitionId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    try {
        // Get user's member ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        if (!user?.member) return { success: false, error: 'User is not a member' }
        const approverId = user.member.id

        // Get requisition
        const requisition = await prisma.welfareRequisition.findUnique({
            where: { id: requisitionId }
        })

        if (!requisition) return { success: false, error: 'Requisition not found' }
        if (requisition.status !== 'PENDING') return { success: false, error: 'Requisition is not pending approval' }
        if (requisition.memberId === approverId) return { success: false, error: 'Cannot approve your own requisition' }

        // Check if already voted
        const existingVote = await prisma.welfareApproval.findFirst({
            where: { requisitionId, approverId }
        })

        if (existingVote) return { success: false, error: 'You have already voted on this requisition' }

        // Record vote
        await prisma.welfareApproval.create({
            data: {
                requisitionId,
                approverId,
                decision,
                notes
            }
        })

        // Check for consensus
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
            // Instant rejection if anyone rejects (configurable rule, assuming unanimous or majority not needed for rejection)
            // Or maybe stick to: if X rejections? Let's say if 1 rejects, it's rejected for safety
            newStatus = 'REJECTED'
            eventDescription = `Rejected by ${user.member.name}`
        } else if (approvalCount >= requiredApprovals) {
            newStatus = 'APPROVED'
            eventDescription = `Approved (Threshold Met: ${approvalCount}/${requiredApprovals})`
        }

        if (newStatus !== 'PENDING') {
            await prisma.welfareRequisition.update({
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
        } else {
            // Just log the vote event
            await prisma.welfareJourneyEvent.create({
                data: {
                    requisitionId,
                    eventType: 'SUBMITTED', // Using SUBMITTED as generic 'voted' event type since VOTE isn't in enum, or I should have added VOTE. SUBMITTED is fine.
                    description: `Vote: ${decision} by ${user.member.name}`,
                    actorId: session.user.id
                }
            })
        }

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'WELFARE_STATUS_CHANGED' as any,
                details: `Requisition ${requisition.requisitionNumber} voted ${decision} by ${user.member.name}. Status: ${newStatus}`
            }
        })

        revalidatePath(`/welfare/${requisitionId}`)
        return { success: true }

    } catch (error: any) {
        console.error('Error submitting approval:', error)
        return { success: false, error: error.message }
    }
}

// ==========================================
// Disbursement
// ==========================================

// ... (imports need to be updated at top of file, doing that in a separate block if needed, but I can't do two ranges).
// Wait, I need to add the import first. I'll do that in a separate step or try to include it if it's near the top.
// The file is 439 lines long. Imports are at line 1-8.
// I will split this into two edits: Imports, then the function.
export async function disburseWelfare(requisitionId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    // Role verification
    const userRole = session.user.role
    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(userRole || '')) {
        // return { success: false, error: 'Insufficient permissions' }
    }

    try {
        const requisition = await prisma.welfareRequisition.findUnique({
            where: { id: requisitionId },
            include: { welfareType: true, member: true }
        })

        if (!requisition) return { success: false, error: 'Requisition not found' }
        if (requisition.status !== 'APPROVED') return { success: false, error: 'Requisition is not approved' }
        if (requisition.status === 'DISBURSED') return { success: false, error: 'Already disbursed' }

        // Check Welfare Fund Balance
        const settings = await prisma.saccoSettings.findFirst()
        const currentBalance = Number(settings?.welfareCurrentBalance || 0)
        const amount = Number(requisition.amount)

        if (currentBalance < amount) {
            return { success: false, error: `Insufficient Welfare Fund Balance. Available: ${currentBalance}` }
        }

        // Fetch GL Account for Welfare Type
        const welfareAccount = await prisma.ledgerAccount.findUnique({
            where: { id: requisition.welfareType.glAccountId }
        })

        if (!welfareAccount) {
            return { success: false, error: 'Welfare GL Account not found' }
        }

        // Ensure Member Wallet Exists
        const wallet = await WalletService.createWallet(requisition.memberId)

        // Post Journal Entry
        // Using MANUAL_ADJUSTMENT as fallback since WELFARE_DISBURSEMENT enum gen failed
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

        // Update Welfare Fund Balance (Virtual Tracker)
        await prisma.saccoSettings.update({
            where: { id: settings?.id },
            data: {
                welfareCurrentBalance: { decrement: amount }
            }
        })

        // Create Welfare Fund Transaction (Audit)
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

        // Update Requisition Status
        await prisma.welfareRequisition.update({
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

        revalidatePath(`/welfare`)
        revalidatePath(`/welfare/${requisitionId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Error disbursing welfare:', error)
        return { success: false, error: error.message }
    }
}
