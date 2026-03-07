import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { submitLoanApproval } from '@/app/loan-approval-actions'

// Validation schema
const approvalSchema = z.object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().max(500).optional()
})

/**
 * PATCH /api/loans/:id/approve - Approve or Reject loan
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validation = approvalSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.issues
            }, { status: 400 })
        }

        const { decision, notes } = validation.data

        try {
            await submitLoanApproval(id, decision, notes || '')

            return NextResponse.json({
                success: true,
                message: `Loan ${decision.toLowerCase()} recorded successfully`
            })
        } catch (error: any) {
            // Handle specific business logic errors
            if (error.message.includes('permission')) {
                return NextResponse.json({
                    error: error.message
                }, { status: 403 })
            }

            if (error.message.includes('already')) {
                return NextResponse.json({
                    error: error.message
                }, { status: 409 })
            }

            throw error
        }

    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to process approval',
            message: error.message
        }, { status: 500 })
    }
}
