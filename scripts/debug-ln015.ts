
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Fetching Transactions for LN015 ---')
    // Find loan first to get internal ID if needed, though schema uses String ID.
    // Assuming LN015 is the loanApplicationNumber or similar, let's search.
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN015' }
    })

    if (!loan) {
        console.error('Loan LN015 not found')
        return
    }

    console.log(`Loan Found: ${loan.id} (Ref: ${loan.loanApplicationNumber})`)

    const txs = await prisma.loanTransaction.findMany({
        where: { loanId: loan.id },
        orderBy: { postedAt: 'asc' }
    })

    console.table(txs.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        isReversed: t.isReversed,
        desc: t.description,
        penaltyAmt: t.penaltyAmount.toString(),
        created: t.createdAt.toISOString()
    })))
}

main()
