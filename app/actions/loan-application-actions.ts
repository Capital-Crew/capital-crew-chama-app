'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getNextLoanNumber } from '@/lib/utils'
import { z } from 'zod'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction } from '@prisma/client'
import { MESSAGES } from '@/lib/constants/messages'
import { calculateLoanQualification } from '@/app/sacco-settings-actions'

/**
 * Zod schema for allowed draft loan fields.
 * SECURITY: Only permit fields a member legitimately edits in the form.
 * Never allow status, outstandingBalance, memberId, etc.
 */
const loanDraftUpdateSchema = z.object({
    amount: z.number().positive().optional(),
    installments: z.number().int().positive().max(360).optional(),
    loanProductId: z.string().optional(),
    purpose: z.string().max(1000).optional(),
    guarantors: z.any().optional(),
    feeExemptions: z.any().optional(),
})

type LoanDraftUpdateInput = z.infer<typeof loanDraftUpdateSchema>

/**
 * Starts a new loan application by creating a blank DRAFT record.
 * This ensures the Loan Number is reserved immediately.
 */
export const startLoanApplication = withAudit(
    { actionType: AuditLogAction.LOAN_APPLIED, domain: 'LOAN', apiRoute: '/api/loans/start' },
    async (ctx, memberId?: string) => {
        ctx.beginStep('Validate User Session');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
        }

        // Determine Member ID
        let targetMemberId = memberId
        if (!targetMemberId) {
            const user = await db.user.findUnique({
                where: { id: session.user.id },
                select: { memberId: true, role: true }
            })
            targetMemberId = user?.memberId || undefined

            if (!targetMemberId) {
                ctx.setErrorCode('MISSING_MEMBER_ID');
                throw new Error(MESSAGES.LOAN.NOT_FOUND)
            }
        }
        ctx.endStep('Validate User Session', { targetMemberId });

        // STRICT: Check for existing drafts first
        ctx.beginStep('Check Existing Drafts');
        const existingDraft = await db.loan.findFirst({
            where: {
                memberId: targetMemberId,
                status: { in: ['DRAFT', 'APPLICATION'] }
            },
            select: { id: true }
        })

        if (existingDraft) {
            ctx.endStep('Check Existing Drafts', { resumed: true, loanId: existingDraft.id });
            return { success: true, loanId: existingDraft.id, message: 'Resumed existing draft' }
        }
        ctx.endStep('Check Existing Drafts', { resumed: false });

        ctx.beginStep('Initialize New Draft');
        try {
            // Optimized: Get last created loan number
            const lastLoan = await db.loan.findFirst({
                orderBy: { loanApplicationNumber: 'desc' },
                select: { loanApplicationNumber: true }
            })

            const nextNumber = getNextLoanNumber(lastLoan?.loanApplicationNumber)

            const loan = await db.loan.create({
                data: {
                    loanApplicationNumber: nextNumber,
                    memberId: targetMemberId,
                    status: 'DRAFT',
                    amount: 0,
                    memberContributionsAtApplication: 0,
                    grossQualifyingAmount: 0,
                    processingFee: 0,
                    insuranceFee: 0,
                    contributionDeduction: 0,
                    existingLoanOffset: 0,
                    totalDeductions: 0,
                    netDisbursementAmount: 0,
                    approvalVotes: [],
                    applicationDate: new Date(),
                    interestRate: 0,
                }
            })

            ctx.captureAfter(loan);
            ctx.endStep('Initialize New Draft', { loanId: loan.id, loanNo: nextNumber });
            return { success: true, loanId: loan.id }
        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            ctx.failStep('Initialize New Draft', error);
            throw new Error(MESSAGES.LOAN.START_FAILED)
        }
    }
)

/**
 * Updates a draft loan (Auto-save)
 */
export const updateLoanDraft = withAudit(
    { actionType: AuditLogAction.LOAN_STATUS_CHANGED, domain: 'LOAN', apiRoute: '/api/loans/update-draft' },
    async (ctx, loanId: string, data: unknown) => {
        ctx.beginStep('Validate Update Payload');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
        }

        const parseResult = loanDraftUpdateSchema.safeParse(data)
        if (!parseResult.success) {
            ctx.setErrorCode('INVALID_PAYLOAD');
            throw new Error('Invalid update data: ' + parseResult.error.issues[0].message)
        }
        const safeData = parseResult.data
        ctx.endStep('Validate Update Payload');

        ctx.beginStep('Validate Ownership');
        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: {
                member: { select: { user: { select: { id: true } } } }
            }
        })
        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error(MESSAGES.LOAN.NOT_FOUND)
        }
        ctx.captureBefore('Loan', loan.id, loan);

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        const isOwner = loan.member?.user?.id === session.user.id
        const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(user?.role || '')

        if (!isOwner && !isAdmin) {
            ctx.setErrorCode('INSUFFICIENT_PERMISSIONS');
            throw new Error(MESSAGES.AUTH.OWNERSHIP_ONLY)
        }

        let updateData: Partial<LoanDraftUpdateInput> = safeData
        if (isAdmin && !isOwner) {
            updateData = safeData.feeExemptions ? { feeExemptions: safeData.feeExemptions } : {}
        }
        ctx.endStep('Validate Ownership');

        if (Object.keys(updateData).length > 0) {
            ctx.beginStep('Update Database Record');
            
            let financialUpdates = {}
            // If amount or product changes, recalculate fees to ensure "Net Disbursement" is accurate
            if (updateData.amount || updateData.loanProductId) {
                try {
                    const newAmount = updateData.amount || Number(loan.amount)
                    const appraisal = await calculateLoanQualification(
                        loan.memberId, 
                        (loan.guarantors as any)?.loansToOffset || [], 
                        newAmount,
                        loan.feeExemptions
                    )
                    
                    financialUpdates = {
                        grossQualifyingAmount: appraisal.grossQualifyingAmount,
                        processingFee: appraisal.processingFee,
                        insuranceFee: appraisal.insuranceFee,
                        contributionDeduction: appraisal.contributionDeduction,
                        existingLoanOffset: appraisal.selectedLoansOffset,
                        totalDeductions: appraisal.totalDeductions,
                        netDisbursementAmount: appraisal.netDisbursementAmount,
                    }
                } catch (calcError) {
                    console.error('[updateLoanDraft] Calculation failed:', calcError)
                }
            }

            const updatedLoan = await db.loan.update({
                where: { id: loanId },
                data: {
                    ...updateData,
                    ...financialUpdates,
                    updatedAt: new Date()
                }
            })
            ctx.captureAfter(updatedLoan);
            ctx.endStep('Update Database Record');
        }

        return { success: true }
    }
)

export const discardDraft = withAudit(
    { actionType: AuditLogAction.LOAN_APPLICATION_CANCELLED, domain: 'LOAN', apiRoute: '/api/loans/discard' },
    async (ctx, loanId: string) => {
        ctx.beginStep('Validate Discard Request');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
        }

        const loan = await db.loan.findUnique({
            where: { id: loanId },
            include: {
                member: { select: { user: { select: { id: true } } } }
            }
        })

        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error(MESSAGES.LOAN.NOT_FOUND)
        }
        ctx.captureBefore('Loan', loan.id, loan);

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        const isSystemAdmin = user?.role === 'SYSTEM_ADMIN'
        const isOwner = loan.member?.user?.id === session.user.id

        if (!isSystemAdmin && !isOwner) {
            ctx.setErrorCode('INSUFFICIENT_PERMISSIONS');
            throw new Error(MESSAGES.AUTH.OWNERSHIP_ONLY)
        }
        ctx.endStep('Validate Discard Request');

        ctx.beginStep('Delete Record');
        await db.loan.delete({ where: { id: loanId } })
        ctx.endStep('Delete Record');

        return { success: true }
    }
)
