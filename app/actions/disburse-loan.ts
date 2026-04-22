'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { AuditLogAction } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = db

/**
 * Disburse a loan (Post Loan)
 * This action credits the member wallet and generates the repayment schedule.
 */
import { LoanService } from '@/services/loan-service'
import { withAudit } from '@/lib/with-audit'

export const disburseLoan = withAudit(
    { actionType: AuditLogAction.LOAN_DISBURSED, domain: 'LOAN', apiRoute: '/api/loans/disburse' },
    async (ctx, loanId: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error("Unauthorized: Please log in to continue")
        }

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            select: { memberId: true, loanApplicationNumber: true, status: true, amount: true }
        })

        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error("Loan not found")
        }
        ctx.captureBefore('Loan', loanId, loan);

        const isOwner = session.user.memberId === loan.memberId
        const isPowerAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(session.user.role)

        if (!isOwner && !isPowerAdmin) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error("Unauthorized: Only the loan initiator or a senior administrator can disburse this loan")
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Execute Disbursement Service');
            const result = await LoanService.disburseLoan(
                loanId,
                session.user.id!,
                session.user.name || 'Admin'
            )
            ctx.endStep('Execute Disbursement Service', { result });

            const updatedLoan = await prisma.loan.findUnique({
                where: { id: loanId },
                select: { id: true, status: true, disbursementDate: true }
            });
            if (updatedLoan) ctx.captureAfter(updatedLoan);

            revalidatePath(`/loans/${loanId}`)
            revalidatePath('/dashboard')
            revalidatePath('/accounts')
            revalidatePath('/wallet')

            return result
        } catch (error: any) {
            // TODO: Log error to monitoring service
            ctx.setErrorCode('DISBURSEMENT_FAILED');
            return { error: error.message || "Failed to disburse loan" }
        }
    }
);


