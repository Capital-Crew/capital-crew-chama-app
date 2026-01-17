import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { calculateLoanQualification } from '@/app/sacco-settings-actions'
import { generateLoanApplicationNumber, generateRepaymentSchedule } from '@/lib/utils'

// Validation schema
const loanApplicationSchema = z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    loanProductId: z.string().min(1, 'Loan product is required'),
    requestedAmount: z.number().positive('Amount must be positive'),
    contractRef: z.string().optional()
})

/**
 * POST /api/loans - Submit loan application
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validation = loanApplicationSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.issues
            }, { status: 400 })
        }

        const { memberId, loanProductId, requestedAmount, contractRef } = validation.data

        // Verify user is submitting for themselves or is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        const isAdmin = user?.role && ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user.role)

        if (!isAdmin && user?.member?.id !== memberId) {
            return NextResponse.json({
                error: 'You can only submit loan applications for yourself'
            }, { status: 403 })
        }

        // Get product
        const product = await prisma.loanProduct.findUnique({ where: { id: loanProductId } })
        if (!product) {
            return NextResponse.json({ error: 'Invalid loan product' }, { status: 404 })
        }

        // Calculate loan appraisal WITH the requested amount
        // This ensures fees are calculated correctly based on the actual loan amount
        const appraisal = await calculateLoanQualification(memberId, [], requestedAmount)

        // Validate requested amount against gross qualifying limit (not net disbursement)
        // The user qualifies for up to grossQualifyingAmount, and deductions are taken from that
        if (requestedAmount > appraisal.grossQualifyingAmount) {
            return NextResponse.json({
                error: 'Amount exceeds qualifying limit',
                message: `Requested amount (KES ${requestedAmount.toLocaleString()}) exceeds your qualifying limit of KES ${appraisal.grossQualifyingAmount.toLocaleString()}`,
                appraisal
            }, { status: 400 })
        }

        // Validate that net disbursement is positive (deductions don't exceed loan amount)
        if (appraisal.netDisbursementAmount <= 0) {
            return NextResponse.json({
                error: 'Deductions exceed loan amount',
                message: `Total deductions (KES ${appraisal.totalDeductions.toLocaleString()}) exceed the requested amount (KES ${requestedAmount.toLocaleString()}). Net disbursement would be KES ${appraisal.netDisbursementAmount.toLocaleString()}.`,
                appraisal
            }, { status: 400 })
        }

        // Generate loan number
        // Optimize: Fetch only the last created loan number to increment
        const lastLoan = await prisma.loan.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { loanApplicationNumber: true }
        })
        // Pass pseudo-array to generator if it relies on length, OR better: refactor generator?
        // Checking utils.ts: generateLoanApplicationNumber uses `starts with prefix` count.
        // So we DO need a count of loans for this month.
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `LN-${year}${month}-`;

        const count = await prisma.loan.count({
            where: {
                loanApplicationNumber: {
                    startsWith: prefix
                }
            }
        });

        const sequence = count + 1;
        const loanApplicationNumber = `${prefix}${sequence.toString().padStart(3, '0')}`;

        // Generate repayment schedule
        const tempLoan = { amount: requestedAmount, applicationDate: new Date().toISOString() }
        const schedule = generateRepaymentSchedule(tempLoan as any, product as any)
        const dueDate = schedule[schedule.length - 1]?.dueDate
            ? new Date(schedule[schedule.length - 1].dueDate)
            : new Date()

        // Create loan
        const loan = await prisma.loan.create({
            data: {
                loanApplicationNumber,
                memberId,
                loanProductId,
                amount: requestedAmount,
                applicationDate: new Date(),
                dueDate,
                interestRate: product.interestRatePerPeriod,
                status: 'PENDING_APPROVAL',

                // Appraisal fields
                memberSharesAtApplication: appraisal.memberShares,
                grossQualifyingAmount: appraisal.grossQualifyingAmount,
                processingFee: appraisal.processingFee,
                insuranceFee: appraisal.insuranceFee,
                shareCapitalDeduction: appraisal.shareCapitalDeduction,
                existingLoanOffset: appraisal.selectedLoansOffset,  // Fixed: use selectedLoansOffset
                totalDeductions: appraisal.totalDeductions,
                netDisbursementAmount: appraisal.netDisbursementAmount,

                approvalVotes: [],
                repaymentSchedule: JSON.parse(JSON.stringify(schedule)) as any,
                feeExemptions: {
                    applicationFee: false,
                    rescheduleFee: false,
                    topUpFee: false,
                    penaltyFee: false
                },
                loanContract: contractRef || null
            }
        })

        // Create journey event
        await prisma.loanJourneyEvent.create({
            data: {
                loanId: loan.id,
                eventType: 'APPLICATION_SUBMITTED',
                description: `Loan application submitted for KES ${requestedAmount.toLocaleString()}`,
                actorId: session.user.id,
                actorName: user?.name || 'Unknown',
                metadata: {
                    requestedAmount,
                    netDisbursementAmount: appraisal.netDisbursementAmount,
                    memberShares: appraisal.memberShares
                }
            }
        })

        // Create notification
        await prisma.notification.create({
            data: {
                memberId,
                type: 'APPLICATION_RECEIVED',
                message: `Application ${loanApplicationNumber} received. Net disbursement: KES ${appraisal.netDisbursementAmount.toLocaleString()}`,
                loanId: loan.id
            }
        })

        return NextResponse.json({
            success: true,
            loan: {
                ...loan,
                appraisal
            }
        })

    } catch (error: any) {
        console.error('Loan application error:', error)
        return NextResponse.json({
            error: 'Failed to create loan application',
            message: error.message
        }, { status: 500 })
    }
}

/**
 * GET /api/loans - List loans with filters
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const requiresApproval = searchParams.get('requiresApproval') === 'true'

        // Get user and member
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        })

        const isAdmin = user?.role && ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user.role)
        const canApprove = user?.member?.canApproveLoan

        // Build query
        const where: any = {}

        // Non-admin users see only their loans
        if (!isAdmin && user?.member) {
            where.memberId = user.member.id
        }

        if (status) {
            where.status = status
        }

        if (requiresApproval && canApprove) {
            where.status = 'PENDING_APPROVAL'
        }

        const loans = await prisma.loan.findMany({
            where,
            include: {
                member: true,
                loanProduct: true,
                approvals: {
                    include: {
                        approver: true
                    }
                }
            },
            orderBy: { applicationDate: 'desc' }
        })

        return NextResponse.json({ loans })

    } catch (error: any) {
        console.error('List loans error:', error)
        return NextResponse.json({
            error: 'Failed to fetch loans',
            message: error.message
        }, { status: 500 })
    }
}
