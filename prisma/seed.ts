

import { PrismaClient, UserRole, ChargeType, ChargeCalculationType, RepaymentFrequencyType, InterestType, InterestCalculationPeriodType, AmortizationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Create Charges
    const charge1 = await prisma.chargeTemplate.create({
        data: {
            name: 'Standard Processing Fee',
            chargeType: ChargeType.FEE,
            calculationType: ChargeCalculationType.FIXED,
            amount: 500,
            dueDateOffset: 0,
            isActive: true,
        }
    })

    const charge2 = await prisma.chargeTemplate.create({
        data: {
            name: 'Late Penalty (Flat)',
            chargeType: ChargeType.PENALTY,
            calculationType: ChargeCalculationType.FIXED,
            amount: 200,
            dueDateOffset: 1,
            isActive: true,
        }
    })

    const charge3 = await prisma.chargeTemplate.create({
        data: {
            name: 'Administrative Levy',
            chargeType: ChargeType.FEE,
            calculationType: ChargeCalculationType.PERCENTAGE,
            amount: 1.5,
            dueDateOffset: 0,
            isActive: true,
        }
    })

    // 2. Create Loan Products
    const product1 = await prisma.loanProduct.create({
        data: {
            name: 'Emergency Loan',
            principal: 5000,
            numberOfRepayments: 6,
            repaymentEvery: 1,
            repaymentFrequencyType: RepaymentFrequencyType.MONTHS,
            interestRatePerPeriod: 2,
            interestType: InterestType.FLAT,
            interestCalculationPeriodType: InterestCalculationPeriodType.SAME_AS_REPAYMENT,
            amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
            isActive: true,
            charges: [
                { ...charge1, isPenalty: false, loanProductId: 'lp1' }
            ]
        }
    })

    // 3. Create Members
    const member1 = await prisma.member.create({
        data: {
            memberNumber: 1,
            name: 'Alice Johnson',
            contact: 'alice@example.com'
        }
    })

    const member2 = await prisma.member.create({
        data: {
            memberNumber: 2,
            name: 'Bob Williams',
            contact: 'bob@example.com'
        }
    })

    const member3 = await prisma.member.create({
        data: {
            memberNumber: 3,
            name: 'Charlie Brown',
            contact: 'charlie@example.com'
        }
    })

    // 4. Create Admin Member & User (Chairperson)
    const member4 = await prisma.member.create({
        data: {
            memberNumber: 4,
            name: 'System Administrator',
            contact: 'admin@capitalcrew.com'
        }
    })

    // Hash the admin password
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@capitalcrew.com' },
        update: {
            role: UserRole.SYSTEM_ADMIN,
            permissions: {
                canViewAll: true, canAddData: true, canApprove: true,
                canManageSettings: true, canViewReports: true, canViewAudit: true,
                canManageUserRights: true, canExemptFees: true, canEnrollMembers: true,
                canReverse: true
            },
            passwordHash: hashedPassword // Ensure password is updated if user exists
        },
        create: {
            name: 'System Administrator',
            username: 'admin',
            email: 'admin@capitalcrew.com',
            passwordHash: hashedPassword,
            role: UserRole.SYSTEM_ADMIN,
            memberId: member4.id,
            permissions: {
                canViewAll: true, canAddData: true, canApprove: true,
                canManageSettings: true, canViewReports: true, canViewAudit: true,
                canManageUserRights: true, canExemptFees: true, canEnrollMembers: true,
                canReverse: true
            }
        }
    })

    // 5. Create Default Email Templates
    await prisma.emailTemplate.upsert({
        where: { type: 'LOAN_APPROVAL_REQUEST' },
        update: {},
        create: {
            type: 'LOAN_APPROVAL_REQUEST',
            name: 'Loan Approval Request',
            subject: 'Action Required: Loan Approval — {{applicant_name}}',
            body: `A new loan application requires your review.\n\nApplicant: {{applicant_name}}\nLoan ID: {{loan_id}}\nAmount: KES {{loan_amount}}\nTerm: {{loan_term}}\nRate: {{interest_rate}}\n\nReview the full application here:\n{{approval_link}}\n\nA detailed Loan Card PDF is attached to this email.`,
            isActive: true,
        }
    })

    await prisma.emailTemplate.upsert({
        where: { type: 'LOAN_DISBURSEMENT' },
        update: {},
        create: {
            type: 'LOAN_DISBURSEMENT',
            name: 'Loan Disbursement Notification',
            subject: 'Your Loan is Ready for Disbursement — KES {{loan_amount}}',
            body: `Dear {{applicant_name}},\n\nYour loan of KES {{loan_amount}} has been approved and is ready for disbursement.\n\nExpected disbursement date: {{disbursement_date}}\nRepayment summary: {{repayment_summary}}\n\nNext steps:\n{{next_steps}}\n\nThank you for choosing us.`,
            isActive: true,
        }
    })

    console.log('✅ Database seeded successfully!')
    console.log('\n📧 Admin Credentials:')
    console.log('   Email: admin@capitalcrew.com')
    console.log('   Password: Admin123!')
    console.log('\n⚠️  Please change this password after first login!\n')
    console.log({ product1, member1, adminUser })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
