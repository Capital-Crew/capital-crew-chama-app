/**
 * End-to-end test: fires LoanNotificationService directly
 * against a real loan and reports the outcome.
 */
import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('\n====== Email Notification E2E Test ======\n')

    // 1. Find a real loan that has a member and product
    const loan = await prisma.loan.findFirst({
        where: { memberId: { not: '' } },
        orderBy: { updatedAt: 'desc' },
        include: { member: true, loanProduct: true }
    })

    if (!loan) {
        console.error('ERROR: No loans found in the database.')
        process.exit(1)
    }

    console.log(`Using loan: ${loan.loanApplicationNumber} (${loan.status})`)
    console.log(`  Member  : ${loan.member?.name}`)
    console.log(`  Amount  : KES ${Number(loan.amount).toLocaleString()}`)
    console.log(`  Product : ${loan.loanProduct?.name || '(none)'}`)

    // 2. Clear any existing notification log for this loan so the test isn't blocked by the dedup guard
    const deleted = await prisma.emailNotificationLog.deleteMany({
        where: { loanId: loan.id, templateType: 'LOAN_APPROVAL_REQUEST' }
    })
    if (deleted.count > 0) {
        console.log(`\n  (Cleared ${deleted.count} existing log entry so test can re-fire)`)
    }

    // 3. Call the notification service
    console.log('\n>>> Calling LoanNotificationService.handleApprovalRequest ...\n')
    const { LoanNotificationService } = await import('../lib/services/LoanNotificationService')
    await LoanNotificationService.handleApprovalRequest(loan.id)

    // 4. Check the log
    console.log('\n>>> Checking EmailNotificationLog ...\n')
    await new Promise(r => setTimeout(r, 2000)) // small wait for any async writes

    const logEntry = await prisma.emailNotificationLog.findUnique({
        where: { loanId_templateType: { loanId: loan.id, templateType: 'LOAN_APPROVAL_REQUEST' } }
    })

    if (!logEntry) {
        console.error('RESULT: ❌ FAILED — No log entry was created. Email dispatch did not complete.')
    } else {
        const icon = logEntry.status === 'SENT' ? '✅' : '❌'
        console.log(`RESULT: ${icon} Status = ${logEntry.status}`)
        console.log(`  Recipients : ${logEntry.recipients.join(', ')}`)
        if (logEntry.error) {
            console.error(`  Error      : ${logEntry.error}`)
        }
    }

    console.log('\n====== Test Complete ======\n')
}

main()
    .catch(e => { console.error('Test script error:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
