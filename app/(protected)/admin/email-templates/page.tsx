import { getEmailTemplates } from '@/app/actions/email-template-actions'
import EmailTemplatesClient from './EmailTemplatesClient'
import { protectPage } from "@/lib/with-module-protection"
import { redirect } from "next/navigation"

export const metadata = {
    title: 'Email Templates | Capital Crew',
    description: 'Manage system-wide email templates and notifications',
}

export default async function EmailTemplatesPage() {
    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    // getEmailTemplates() already throws if not System Admin
    const templates = await getEmailTemplates()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Email Templates</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
                Manage the automated emails sent by the system to members and approvers.
            </p>

            <EmailTemplatesClient initialTemplates={templates} />
        </div>
    )
}
