import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding email templates...')

    const approvalTemplate = await prisma.emailTemplate.upsert({
        where: { type: 'LOAN_APPROVAL_REQUEST' },
        update: {},
        create: {
            type: 'LOAN_APPROVAL_REQUEST',
            name: 'Loan Approval Request',
            subject: 'Action Required: Loan Application from {{applicant_name}}',
            body: `Dear Approver,

A new loan application has been submitted and requires your review.

Applicant: {{applicant_name}}
Loan ID: {{loan_id}}
Requested Amount: KES {{loan_amount}}
Loan Term: {{loan_term}}
Interest Rate: {{interest_rate}}

Please log in to review and approve or reject this application:
{{approval_link}}

A copy of the Loan Appraisal Card is attached to this email.

Regards,
Capital Crew System`,
            isActive: true,
        }
    })
    console.log('✅ Upserted:', approvalTemplate.name)

    const disbursementTemplate = await prisma.emailTemplate.upsert({
        where: { type: 'LOAN_DISBURSEMENT' },
        update: {},
        create: {
            type: 'LOAN_DISBURSEMENT',
            name: 'Loan Disbursement Notification',
            subject: 'Your Loan Has Been Disbursed — {{loan_id}}',
            body: `Dear {{applicant_name}},

Great news! Your loan application has been approved and the funds have been disbursed to your account.

Loan ID: {{loan_id}}
Disbursed Amount: KES {{loan_amount}}
Disbursement Date: {{disbursement_date}}
First Repayment: {{repayment_summary}}

{{next_steps}}

If you have any questions, please contact the Sacco office.

Regards,
Capital Crew System`,
            isActive: true,
        }
    })
    console.log('✅ Upserted:', disbursementTemplate.name)

    console.log('\nDone! Email templates are ready.')
}

main()
    .catch(e => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
