import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Find the loan
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN002' },
        select: {
            id: true,
            loanApplicationNumber: true,
            amount: true,
            status: true,
            penalties: true,
            disbursementDate: true,
            netDisbursementAmount: true,
            memberId: true,
            member: { select: { name: true, memberNumber: true } },
        }
    })

    if (!loan) {
        console.log('❌ Loan LN002 not found')
        await prisma.$disconnect()
        return
    }

    console.log('\n=== LOAN LN002 ===')
    console.log(`ID: ${loan.id}`)
    console.log(`Member: ${loan.member.name} (#${loan.member.memberNumber})`)
    console.log(`Amount: ${loan.amount}`)
    console.log(`Net Disbursement: ${loan.netDisbursementAmount}`)
    console.log(`Status: ${loan.status}`)
    console.log(`Penalties: ${loan.penalties}`)

    // Get all transactions
    const transactions = await prisma.loanTransaction.findMany({
        where: { loanId: loan.id },
        orderBy: { postedAt: 'asc' },
        select: {
            id: true,
            type: true,
            amount: true,
            principalAmount: true,
            interestAmount: true,
            penaltyAmount: true,
            feeAmount: true,
            description: true,
            isReversed: true,
            reversedAt: true,
            postedAt: true,
            referenceId: true,
        }
    })

    console.log(`\n=== TRANSACTIONS (${transactions.length}) ===`)
    for (const tx of transactions) {
        const status = tx.isReversed ? '🔴 REVERSED' : '🟢 ACTIVE'
        console.log(`${status} | ${tx.type.padEnd(15)} | Amount: ${String(tx.amount).padStart(10)} | P: ${tx.principalAmount} I: ${tx.interestAmount} Pen: ${tx.penaltyAmount} Fee: ${tx.feeAmount} | ${tx.description?.substring(0, 50) || '-'}`)
        if (tx.isReversed) console.log(`   ↳ Reversed at: ${tx.reversedAt}`)
    }

    // Check linked GL entries
    const txIds = transactions.map(t => t.id)
    const glEntries = await prisma.ledgerTransaction.findMany({
        where: {
            OR: [
                { externalReferenceId: { in: txIds } },
                { referenceId: { in: txIds } },
            ]
        },
        include: {
            ledgerEntries: {
                include: { ledgerAccount: { select: { code: true, name: true } } }
            }
        },
        orderBy: { transactionDate: 'asc' }
    })

    console.log(`\n=== GL JOURNAL ENTRIES (${glEntries.length}) ===`)
    for (const gl of glEntries) {
        const status = gl.isReversed ? '🔴 REVERSED' : '🟢 ACTIVE'
        console.log(`\n${status} | ${gl.description} | Ref: ${gl.referenceId?.substring(0, 8) || '-'} | ExtRef: ${gl.externalReferenceId?.substring(0, 8) || '-'}`)
        for (const line of gl.ledgerEntries) {
            const dr = Number(line.debitAmount)
            const cr = Number(line.creditAmount)
            console.log(`   ${line.ledgerAccount.code} ${line.ledgerAccount.name.padEnd(30)} | Dr: ${String(dr).padStart(10)} | Cr: ${String(cr).padStart(10)}`)
        }
    }

    // Check installments
    const installments = await prisma.repaymentInstallment.findMany({
        where: { loanId: loan.id },
        orderBy: { dueDate: 'asc' },
        select: {
            installmentNumber: true,
            dueDate: true,
            principalDue: true,
            interestDue: true,
            penaltyDue: true,
            principalPaid: true,
            interestPaid: true,
            penaltyPaid: true,
            isFullyPaid: true,
        }
    })

    console.log(`\n=== INSTALLMENTS (${installments.length}) ===`)
    for (const inst of installments) {
        const paid = inst.isFullyPaid ? '✅' : '⬜'
        console.log(`${paid} #${inst.installmentNumber} | Due: ${inst.dueDate.toISOString().split('T')[0]} | P: ${inst.principalDue}/${inst.principalPaid} | I: ${inst.interestDue}/${inst.interestPaid} | Pen: ${inst.penaltyDue}/${inst.penaltyPaid}`)
    }

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
