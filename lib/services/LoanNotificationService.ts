import { db } from '@/lib/db'
import { EmailService } from '@/lib/services/EmailService'
import { renderTemplate } from '@/lib/utils/renderTemplate'
import { generateLoanCardPdf } from '@/lib/utils/generateLoanCardPdf'
import { format } from 'date-fns'

export class LoanNotificationService {

    /**
     * Internal generic method to process an email template block, deduplicate, and dispatch it
     */
    private static async dispatchNotification(
        loanId: string,
        templateType: string,
        recipients: string[],
        variables: Record<string, string>,
        attachments: any[] = []
    ) {

        if (!recipients || recipients.length === 0) {
            return
        }

        // Dedup Check — skip if already sent for this loan+templateType combo
        try {
            const existingLog = await db.emailNotificationLog.findUnique({
                where: {
                    loanId_templateType: { loanId, templateType }
                }
            })
            if (existingLog) {
                return
            }
        } catch (err) {
            // TODO: replace with structured logger
            console.error(`[LoanNotificationService] Dedup check failed:`, err)
            // Don't block on dedup failure — proceed with sending
        }

        // Fetch the active template
        let template: any = null
        try {
            template = await db.emailTemplate.findUnique({ where: { type: templateType } })
        } catch (err) {
            // TODO: replace with structured logger
            console.error(`[LoanNotificationService] Could not fetch template '${templateType}':`, err)
            return
        }

        if (!template || !template.isActive) {
            return
        }

        // Render Template
        const subject = renderTemplate(template.subject, variables)
        const body = renderTemplate(template.body, variables)
        const htmlBody = body.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')

        // Send Email
        let success = false
        try {
            success = await EmailService.sendEmail(recipients, subject, htmlBody, attachments)
        } catch (err) {
            // TODO: replace with structured logger
            console.error(`[LoanNotificationService] sendEmail threw:`, err)
        }

        // Log the dispatch
        try {
            await db.emailNotificationLog.create({
                data: {
                    loanId,
                    templateType,
                    recipients,
                    status: success ? 'SENT' : 'FAILED',
                    error: success ? null : 'SMTP Transport Failed'
                }
            })
        } catch (err) {
            // TODO: replace with structured logger
            console.error(`[LoanNotificationService] Could not write EmailNotificationLog:`, err)
        }
    }

    /**
     * Dispatched when Loan -> PENDING_APPROVAL
     * Sends to all users who have loan approval rights
     */
    static async handleApprovalRequest(loanId: string) {
        try {
            const loan = await db.loan.findUnique({
                where: { id: loanId },
                include: { member: true, loanProduct: true }
            })
            if (!loan || !loan.member) {
                return
            }

            // Fetch ALL users then keep only those with a valid email
            const allUsers = await db.user.findMany({ select: { email: true } })
            const approverUsers = allUsers.filter(u => u.email && u.email.trim().length > 0)

            const approverEmails = approverUsers
                .map(u => u.email)
                .filter((e): e is string => Boolean(e))


            if (approverEmails.length === 0) {
                return
            }

            const variables = {
                applicant_name: loan.member.name,
                loan_id: loan.loanApplicationNumber ?? loanId,
                loan_amount: Number(loan.amount).toLocaleString(),
                loan_term: `${loan.installments || loan.loanProduct?.numberOfRepayments || '—'} months`,
                interest_rate: `${Number(loan.interestRate)}% per month`,
                approval_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/approvals`,
                disbursement_date: loan.disbursementDate ? format(loan.disbursementDate, 'PPP') : 'TBD',
                repayment_summary: 'Pending Disbursement',
                next_steps: ''
            }

            // Generate Loan Card PDF attachment
            let pdfAttachments: any[] = []
            try {
                const pdfBuffer = await generateLoanCardPdf(loanId)
                pdfAttachments = [{
                    filename: `loan-summary-${loan.loanApplicationNumber || loanId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }]
            } catch (pdfErr) {
                // TODO: replace with structured logger
                console.error(`[LoanNotificationService] PDF generation failed (sending without attachment):`, pdfErr)
            }

            await this.dispatchNotification(
                loanId,
                'LOAN_APPROVAL_REQUEST',
                approverEmails,
                variables,
                pdfAttachments
            )
        } catch (err) {
            // TODO: replace with structured logger
            console.error(`[LoanNotificationService] handleApprovalRequest error:`, err)
        }
    }

    /**
     * Dispatched when Loan -> DISBURSED
     * Sends to the loan applicant
     */
    static async handleDisbursement(loanId: string, nextStepsText: string = '') {
        try {
            const loan = await db.loan.findUnique({
                where: { id: loanId },
                include: { member: true, repaymentSchedule: true, loanProduct: true }
            })

            if (!loan || !loan.member) {
                return
            }

            const applicantUser = await db.user.findUnique({ where: { memberId: loan.memberId } })
            if (!applicantUser?.email) {
                return
            }

            const schedule = (loan.cachedSchedule || loan.repaymentSchedule) as any
            const firstInstallmentAmount = schedule?.[0] ? Number(schedule[0].total) : 0
            const firstInstallmentDate = schedule?.[0] ? format(new Date(schedule[0].dueDate), 'PPP') : 'N/A'
            const repSumStr = firstInstallmentAmount > 0
                ? `KES ${firstInstallmentAmount.toLocaleString()} due by ${firstInstallmentDate}`
                : 'Please refer to your repayment schedule'

            const variables = {
                applicant_name: loan.member.name,
                loan_id: loan.loanApplicationNumber ?? loanId,
                loan_amount: Number(loan.amount).toLocaleString(),
                loan_term: `${loan.installments || loan.loanProduct?.numberOfRepayments || '—'} months`,
                interest_rate: `${Number(loan.interestRate)}% per month`,
                approval_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
                disbursement_date: loan.disbursementDate
                    ? format(new Date(loan.disbursementDate), 'PPP')
                    : format(new Date(), 'PPP'),
                repayment_summary: repSumStr,
                next_steps: nextStepsText
            }

            await this.dispatchNotification(
                loanId,
                'LOAN_DISBURSEMENT',
                [applicantUser.email],
                variables,
                []
            )
        } catch (err) {
            // TODO: replace with structured logger
            console.error(`[LoanNotificationService] handleDisbursement error:`, err)
        }
    }
}
