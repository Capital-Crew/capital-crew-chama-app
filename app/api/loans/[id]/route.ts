import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { serializeLoan } from '@/lib/serializers'

/**
 * GET /api/loans/:id - Fetch full loan card with appraisal, approvals, and journey
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        const { id } = await params

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const loan = await prisma.loan.findUnique({
            where: { id },
            include: {
                member: true,
                loanProduct: true,
                approvals: {
                    include: {
                        approver: true
                    },
                    orderBy: { timestamp: 'asc' }
                },
                journeyEvents: {
                    orderBy: { timestamp: 'asc' }
                },
                topUps: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        oldLoan: { // Correct relation name
                            include: {
                                loanProduct: true
                            }
                        }
                    }
                }
            }
        })

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
        }

        // Access control: members can only see their own loans
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        const isAdmin = user?.role && ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(user.role)

        if (!isAdmin && user?.member?.id !== loan.memberId) {
            return NextResponse.json({
                error: 'You can only view your own loans'
            }, { status: 403 })
        }

        // Check if current user has approved
        const currentUserHasApproved = loan.approvals.some(
            (a: any) => a.approverId === user?.member?.id
        )

        // Approval count
        const approvalsCount = loan.approvals.filter((a: any) => a.decision === 'APPROVED').length

        // Fetch Sacco Settings for required approvals
        const settings = await prisma.saccoSettings.findFirst()
        const requiredApprovals = settings?.requiredApprovals || 3

        // Recalculate financial fields dynamically to ensure accuracy (especially for top-ups)
        // This fixes any potential stale data in stored fields
        // @ts-ignore
        const calculatedOffset = loan.topUps.reduce((sum, t) => sum + (Number(t.totalOffset) || 0), 0)

        // Ensure strictly numbers for deductions
        const processingFee = Number(loan.processingFee) || 0
        const insuranceFee = Number(loan.insuranceFee) || 0
        const shareCapitalDeduction = Number(loan.shareCapitalDeduction) || 0

        const calculatedTotalDeductions = processingFee + insuranceFee + shareCapitalDeduction + calculatedOffset
        const calculatedNetDisbursement = Number(loan.amount) - calculatedTotalDeductions

        return NextResponse.json({
            loan: serializeLoan({
                ...loan,
                // Map topUps to match frontend interface (clearedLoan)
                topUps: loan.topUps.map((t: any) => ({
                    ...t,
                    clearedLoan: t.oldLoan,
                    // Serialize decimal fields in topUps
                    // Use simple property access matching schema
                    totalOffset: typeof t.totalOffset === 'object' ? Number(t.totalOffset) : (t.totalOffset || 0),
                    principalOffset: typeof t.principalBalance === 'object' ? Number(t.principalBalance) : (t.principalBalance || 0),
                    interestOffset: typeof t.accruedInterest === 'object' ? Number(t.accruedInterest) : (t.accruedInterest || 0),
                    penaltyOffset: typeof t.penalties === 'object' ? Number(t.penalties) : (t.penalties || 0),
                    otherCharges: typeof t.refinanceFee === 'object' ? Number(t.refinanceFee) : (t.refinanceFee || 0)
                })),

                // Override with dynamic calculations
                existingLoanOffset: calculatedOffset,
                totalDeductions: calculatedTotalDeductions,
                netDisbursementAmount: calculatedNetDisbursement,

                approvalsCount,
                currentUserHasApproved,
                approvalsRequired: requiredApprovals
            })
        })

    } catch (error: any) {
        console.error('Get loan error:', error)
        return NextResponse.json({
            error: 'Failed to fetch loan',
            message: error.message
        }, { status: 500 })
    }
}
