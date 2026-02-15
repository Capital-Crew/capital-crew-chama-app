
import { db } from '@/lib/db'

async function main() {
    const loanAppNum = 'LN015'
    console.log(`--- Investigating Loan ${loanAppNum} ---`)

    const loan = await db.loan.findUnique({
        where: { loanApplicationNumber: loanAppNum },
        include: {
            transactions: {
                orderBy: { postedAt: 'asc' }
            }
        }
    })

    if (!loan) {
        console.log('Loan not found')
        return
    }

    console.log(`Loan ID: ${loan.id}`)
    console.log(`Status: ${loan.status}`)
    console.log(`Cached Outstanding Balance: ${loan.outstandingBalance}`)
    console.log(`Legacy Current Balance: ${loan.current_balance}`)

    console.log('\n--- Transactions ---')
    console.table(loan.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        isReversed: t.isReversed,
        ref: t.referenceId,
        postedAt: t.postedAt.toISOString(),
        description: t.description
    })))
}

main()
