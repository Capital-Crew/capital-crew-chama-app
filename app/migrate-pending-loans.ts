/**
 * Direct SQL migration to update pending loans with sufficient approvals
 * This bypasses Prisma type checking since the client may be out of sync
 */

'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function migratePendingLoansDirectSQL() {
    const session = await auth()

    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    // Only allow admins to run migrations
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user?.role || '')) {
        throw new Error('Only administrators can run migrations')
    }

    // Get SACCO settings for required approvals
    const settingsResult = await prisma.$queryRaw<Array<{ requiredApprovals: number }>>`
        SELECT "requiredApprovals" FROM "SaccoSettings" LIMIT 1
    `
    const requiredApprovals = settingsResult[0]?.requiredApprovals || 1

    // Get all pending loans with approval counts
    const pendingLoansResult = await prisma.$queryRaw<Array<{
        id: string
        loanApplicationNumber: string
        memberId: string
        approvalCount: bigint
    }>>`
        SELECT 
            l.id,
            l."loanApplicationNumber",
            l."memberId",
            COUNT(la.id) as "approvalCount"
        FROM "Loan" l
        LEFT JOIN "LoanApproval" la ON l.id = la."loanId"
        WHERE l.status = 'PENDING_APPROVAL'
        GROUP BY l.id, l."loanApplicationNumber", l."memberId"
    `

    const results = {
        total: pendingLoansResult.length,
        updated: 0,
        skipped: 0,
        details: [] as Array<{ loanNumber: string, approvals: number, action: string }>
    }

    for (const loan of pendingLoansResult) {
        const approvalCount = Number(loan.approvalCount)

        if (approvalCount >= requiredApprovals) {
            // Update to APPROVED using raw SQL
            await prisma.$executeRaw`
                UPDATE "Loan"
                SET status = 'APPROVED', "updatedAt" = NOW()
                WHERE id = ${loan.id}
            `

            // Create journey event
            await prisma.$executeRaw`
                INSERT INTO "LoanJourneyEvent" (id, "loanId", "eventType", description, "actorId", "actorName", timestamp)
                VALUES (
                    gen_random_uuid(),
                    ${loan.id},
                    'APPROVED',
                    ${`Loan approved via migration (${approvalCount}/${requiredApprovals} approvals)`},
                    ${session.user.id},
                    ${user?.name || 'System'},
                    NOW()
                )
            `

            // Create notification
            await prisma.$executeRaw`
                INSERT INTO "Notification" (id, "memberId", type, message, "loanId", "isRead", timestamp)
                VALUES (
                    gen_random_uuid(),
                    ${loan.memberId},
                    'LOAN_APPROVED',
                    ${`Your loan ${loan.loanApplicationNumber} has been approved! (${approvalCount}/${requiredApprovals} approvals). Ready for disbursement.`},
                    ${loan.id},
                    false,
                    NOW()
                )
            `

            results.updated++
            results.details.push({
                loanNumber: loan.loanApplicationNumber,
                approvals: approvalCount,
                action: 'Updated to APPROVED'
            })
        } else {
            results.skipped++
            results.details.push({
                loanNumber: loan.loanApplicationNumber,
                approvals: approvalCount,
                action: `Skipped (needs ${requiredApprovals - approvalCount} more approvals)`
            })
        }
    }

    // Create audit log
    await prisma.$executeRaw`
        INSERT INTO "AuditLog" (id, "userId", action, details, timestamp)
        VALUES (
            gen_random_uuid(),
            ${session.user.id},
            'LOAN_APPROVAL',
            ${`Migrated ${results.updated} pending loans to APPROVED status`},
            NOW()
        )
    `

    revalidatePath('/loans')
    revalidatePath('/dashboard')

    return results
}
