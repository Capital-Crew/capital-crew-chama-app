'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { renderTemplate } from '@/lib/utils/renderTemplate'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'

// Utility middleware style guard
async function requireSystemAdmin() {
    const session = await auth()
    if (!session || !session.user) throw new Error("Unauthorized")

    // Standard role casting from session object
    const role = (session.user as any).role;
    if (role !== UserRole.SYSTEM_ADMIN && role !== 'SYSTEM_ADMINISTRATOR') {
        throw new Error("Forbidden: System Administrator access required")
    }
}

export async function getEmailTemplates() {
    await requireSystemAdmin()
    return await db.emailTemplate.findMany({
        orderBy: { type: 'asc' }
    })
}

export async function getEmailTemplateByType(type: string) {
    await requireSystemAdmin()
    return await db.emailTemplate.findUnique({
        where: { type }
    })
}

export async function updateEmailTemplate(id: string, name: string, subject: string, body: string) {
    await requireSystemAdmin()

    const template = await db.emailTemplate.update({
        where: { id },
        data: { name, subject, body }
    })

    revalidatePath('/admin/email-templates')
    return { success: true, template }
}

export async function toggleEmailTemplate(id: string, isActive: boolean) {
    await requireSystemAdmin()

    const template = await db.emailTemplate.update({
        where: { id },
        data: { isActive }
    })

    revalidatePath('/admin/email-templates')
    return { success: true, template }
}

export async function previewEmailTemplate(type: string, templateBody: string, templateSubject: string) {
    await requireSystemAdmin()

    // Sample dummy data for preview visualization
    const sampleData: Record<string, string> = {
        applicant_name: "[Applicant Name]",
        loan_id: "LN-XXXX-YYY",
        loan_amount: "50,000",
        loan_term: "12 months",
        interest_rate: "2% per month",
        approval_link: `${process.env.APP_URL || 'https://capitalcrew.com'}/admin/loans/LN-XXXX-YYY`,
        disbursement_date: new Date().toLocaleDateString(),
        repayment_summary: "KES 4,500 due by next month",
        next_steps: "Review the repayment schedule and sign the final contract."
    };

    const renderedSubject = renderTemplate(templateSubject, sampleData)
    const renderedBody = renderTemplate(templateBody, sampleData).replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')

    return {
        success: true,
        subject: renderedSubject,
        html: renderedBody
    }
}
