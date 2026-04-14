import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN002' },
    })

    if (!loan) {
        console.log('❌ Loan LN002 not found')
        return
    }

    console.log(`Found LN002: ${loan.id}, Status: ${loan.status}`)

    // 1. Set loan status to CANCELLED and clear penalties
    await prisma.loan.update({
        where: { id: loan.id },
        data: {
            status: 'CANCELLED',
            penalties: 0,
        }
    })
    console.log('✅ Loan status set to CANCELLED, penalties cleared')

    // 2. Void all installments (set dues to 0, mark fully paid)
    const result = await prisma.repaymentInstallment.updateMany({
        where: { loanId: loan.id },
        data: {
            principalDue: 0,
            interestDue: 0,
            penaltyDue: 0,
            feeDue: 0,
            principalPaid: 0,
            interestPaid: 0,
            penaltyPaid: 0,
            feesPaid: 0,
            isFullyPaid: true,
        }
    })
    console.log(`✅ Voided ${result.count} installments`)

    // 3. Verify
    const updated = await prisma.loan.findUnique({
        where: { id: loan.id },
        select: { status: true, penalties: true }
    })
    console.log(`\n✅ Final state: Status=${updated?.status}, Penalties=${updated?.penalties}`)

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
