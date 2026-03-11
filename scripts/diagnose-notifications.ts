import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('\n=== LoanNotificationService Diagnostic ===\n')

    // 1. Check EmailTemplate table
    console.log('1. Checking email templates...')
    const templates = await prisma.emailTemplate.findMany()
    console.log(`   Found ${templates.length} template(s):`, templates.map(t => `${t.type} (active=${t.isActive})`))

    if (templates.length === 0) {
        console.error('   ERROR: No templates found! Run the seed script first.')
        process.exit(1)
    }

    // 2. Check EmailNotificationLog table
    console.log('\n2. Checking notification log...')
    const logs = await prisma.emailNotificationLog.findMany({ take: 5, orderBy: { sentAt: 'desc' } })
    console.log(`   Recent logs (${logs.length}):`, logs.map(l => `${l.templateType}/${l.status}`))

    // 3. Check approvers (by role or canApproveLoan)
    console.log('\n3. Checking approvers...')
    const approverUsers = await prisma.user.findMany({
        where: {
            OR: [
                { role: { in: ['CHAIRPERSON', 'TREASURER', 'SYSTEM_ADMIN', 'SECRETARY'] } },
                { member: { canApproveLoan: true } }
            ]
        },
        select: { email: true, role: true, name: true }
    })
    console.log(`   Found ${approverUsers.length} approver(s):`)
    approverUsers.forEach(u => console.log(`   - ${u.name} (${u.role}) <${u.email}>`))

    if (approverUsers.length === 0) {
        console.warn('   WARNING: No approvers found — approval emails will be silently skipped!')
    }

    // 4. Check a recent PENDING_APPROVAL loan
    console.log('\n4. Checking recent PENDING_APPROVAL loans...')
    const recentLoan = await prisma.loan.findFirst({
        where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'APPROVED'] } },
        orderBy: { updatedAt: 'desc' },
        include: { member: true, loanProduct: true }
    })
    if (recentLoan) {
        console.log(`   Loan: ${recentLoan.loanApplicationNumber} (${recentLoan.status})`)
        console.log(`   Member: ${recentLoan.member?.name}`)
        console.log(`   Amount: KES ${Number(recentLoan.amount).toLocaleString()}`)
    } else {
        console.warn('   No recent loan found')
    }

    // 5. Check SMTP config
    console.log('\n5. Checking SMTP configuration...')
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST
    console.log(`   SMTP_HOST: ${smtpHost || '(not set)'}`)
    console.log(`   SMTP_USER: ${smtpUser ? smtpUser : '(not set)'}`)
    console.log(`   SMTP_PASS: ${smtpPass ? '(set, length ' + smtpPass.length + ')' : '(not set)'}`)

    console.log('\n=== Diagnostic Complete ===\n')
}

main()
    .catch(e => { console.error('Diagnostic failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
