import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { serializeLoan } from '@/lib/serializers'
import { getMemberContributionBalance } from '@/lib/accounting/AccountingEngine'
import { Prisma } from '@prisma/client'

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
            return NextResponse.json({ error: 'Unauthorized', debug: 'No session' }, { status: 401 })
        }

        const loan = await prisma.loan.findUnique({
            where: { id },
            include: {
                member: true,
                loanProduct: true,
                approvals: {
                    include: {
                        approver: {
                            include: {
                                user: true
                            }
                        }
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
                },
                history: {
                    orderBy: { timestamp: 'desc' }
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

        // Granular Checks
        const perms = (user?.permissions as any) || {}
        const hasGranularAccess =
            perms['canViewAll'] === true ||
            perms['canApprove'] === true ||
            perms['APPROVE_LOANS'] === true // Safety fallback

        if (!isAdmin && !hasGranularAccess && user?.member?.id !== loan.memberId) {
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

        const calculatedOffset = loan.topUps.reduce((sum, t) => sum + (Number(t.totalOffset) || 0), 0)

        // Ensure strictly numbers for deductions
        const processingFee = Number(loan.processingFee) || 0
        const insuranceFee = Number(loan.insuranceFee) || 0
        const contributionDeduction = Number(loan.contributionDeduction) || 0

        const calculatedTotalDeductions = processingFee + insuranceFee + contributionDeduction + calculatedOffset
        const calculatedNetDisbursement = Number(loan.amount) - calculatedTotalDeductions

        // FIX: Handle classic negative equity bug
        // 1. If snapshot is negative, make it positive (historical fix)
        let effectiveContributions = Number(loan.memberContributionsAtApplication)
        if (effectiveContributions < 0) effectiveContributions = Math.abs(effectiveContributions)

        // 2. If loan is PENDING, fetch fresh balance to ensure accuracy for appraisal
        if (loan.status === 'PENDING_APPROVAL') {
            try {
                const freshBalance = await getMemberContributionBalance(loan.memberId)
                if (freshBalance > 0) effectiveContributions = freshBalance
            } catch (e) {
            }
        }

        // Prepare Loan Data Object (sanitized/serialized)
        const loanData = {
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
                memberContributionsAtApplication: new Prisma.Decimal(effectiveContributions), // Use corrected value
                existingLoanOffset: new Prisma.Decimal(calculatedOffset),
                totalDeductions: new Prisma.Decimal(calculatedTotalDeductions),
                netDisbursementAmount: new Prisma.Decimal(calculatedNetDisbursement),

                approvalsCount,
                currentUserHasApproved,
                approvalsRequired: requiredApprovals
            } as any)
        }

        // Fetch Active Workflow Request (if any)
        const workflowRequest = await prisma.workflowRequest.findFirst({
            where: {
                entityId: loan.id,
                entityType: 'LOAN',
                status: { not: 'CANCELLED' } // Get active or final, but maybe not cancelled?
            },
            include: {
                currentStage: true,
                workflow: { include: { stages: { orderBy: { stepNumber: 'asc' } } } },
                actions: {
                    include: {
                        actor: true,
                        stage: true
                    },
                    orderBy: { timestamp: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Combine and Return
        return NextResponse.json({
            ...loanData,
            workflowRequest,
            meta: {
                isAdmin,
                isRequester: user?.member?.id === loan.memberId || workflowRequest?.requesterId === session.user.id
            }
        })

    } catch (error: any) {
        // Syntax fixed
        return NextResponse.json({
            error: 'Failed to fetch loan',
            message: error.message
        }, { status: 500 })
    }
}
