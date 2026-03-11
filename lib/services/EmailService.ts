
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

// @ts-ignore
const isProduction = process.env.NODE_ENV === 'production'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

interface Attachment {
    filename: string
    content: Buffer
    contentType?: string
}

export class EmailService {

    /**
     * Send generic email
     */
    static async sendEmail(to: string | string[], subject: string, html: string, attachments: Attachment[] = []) {
        try {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                return false
            }

            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Capital Crew Sacco" <noreply@capitalcrew.co.ke>',
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html,
                attachments
            })

            return true
        } catch (error) {
            console.error('Email send failed:', error)
            return false
        }
    }

    /**
     * Get recipients for an event type
     */
    static async getRecipientsForEvent(eventType: string) {
        const config = await db.notificationConfig.findUnique({
            where: { event: eventType }
        })

        if (!config || !config.isActive) return []
        return config.emails
    }

    /**
     * Send Loan Appraisal (Submission) Email to Admins
     */
    static async sendLoanAppraisal(
        loanId: string,
        memberName: string,
        loanAmount: string,
        pdfBuffer: Buffer
    ) {
        const recipients = await this.getRecipientsForEvent('LOAN_SUBMISSION')

        if (recipients.length === 0) {
            return
        }

        const subject = `New Loan Application: ${memberName} - ${loanAmount}`
        const html = `
            <h2>New Loan Application Received</h2>
            <p><strong>Member:</strong> ${memberName}</p>
            <p><strong>Amount:</strong> ${loanAmount}</p>
            <p>Please find the appraisal report attached.</p>
            <br />
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/loans/${loanId}">View in Admin Dashboard</a>
        `

        await this.sendEmail(recipients, subject, html, [{
            filename: `Appraisal-${memberName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }])
    }

    /**
     * Send Loan Approval to Member
     */
    static async sendLoanApproval(
        memberEmail: string,
        memberName: string,
        loanNumber: string,
        cardPdf: Buffer,
        schedulePdf: Buffer
    ) {
        // Get configured CCs
        const ccs = await this.getRecipientsForEvent('LOAN_APPROVAL')

        // Combine recipients (Dedup)
        const recipients = Array.from(new Set([memberEmail, ...ccs]))


        const subject = `Loan Approved: ${loanNumber}`
        const html = `
            <h2>Congratulations ${memberName}!</h2>
            <p>Your loan application <strong>${loanNumber}</strong> has been approved and disbursed.</p>
            <p>Attached please find:</p>
            <ul>
                <li>Loan Appraisal Card</li>
                <li>Repayment Schedule</li>
            </ul>
        `

        await this.sendEmail(recipients, subject, html, [
            {
                filename: `LoanCard-${loanNumber}.pdf`,
                content: cardPdf,
                contentType: 'application/pdf'
            },
            {
                filename: `Schedule-${loanNumber}.pdf`,
                content: schedulePdf,
                contentType: 'application/pdf'
            }
        ])
    }
}
