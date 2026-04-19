import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * POST /api/loans/[id]/cancel
 * Allows a user to pull back their application if it is PENDING_APPROVAL.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Correct type for async params in Next.js 15
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await context.params
        const loanId = id

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { member: true } // to check ownership
        })

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        if (user?.member?.id !== loan.memberId) {
            return NextResponse.json({ error: 'You can only cancel your own applications.' }, { status: 403 })
        }

        // Condition: Status must be PENDING_APPROVAL
        if (loan.status !== 'PENDING_APPROVAL') {
            return NextResponse.json({ error: 'Only pending applications can be cancelled.' }, { status: 400 })
        }

        // Execution
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Update Loan
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: 'APPLICATION',
                    cancellationCount: { increment: 1 },
                    // Clear legacy votes if any
                    approvalVotes: []
                }
            })

            // 2. Clean up Workflow Requests
            try {
                const workflow = await tx.workflowRequest.findFirst({
                    where: {
                        entityId: loanId,
                        entityType: 'LOAN',
                        status: 'PENDING'
                    }
                })

                if (workflow) {
                    // Delete actions then the request
                    await tx.workflowAction.deleteMany({
                        where: { requestId: workflow.id }
                    })
                    await tx.workflowRequest.delete({
                        where: { id: workflow.id }
                    })
                }
            } catch (e) {
                console.error("[CANCELLATION ERROR] Failed to clean up workflow:", e)
                // Proceed with loan status update anyway to ensure user can at least see it's cancelled
            }


            // 3. Log History
            await tx.loanHistory.create({
                data: {
                    loanId: loan.id,
                    actorName: user.name || 'Unknown',
                    actorRole: user.role,
                    action: 'CANCELLED',
                    version: loan.submissionVersion,
                    metadata: {
                        reason: 'User pulled back application'
                    }
                }
            })
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to cancel application' }, { status: 500 })
    }
}
