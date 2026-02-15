
import { getLoanStatement } from '@/app/actions/getLoanStatement'
import { db } from '@/lib/db'

async function main() {
    console.log('--- Testing Loan Statement Calculation ---')

    // Find a loan with a reversal if possible, or just any loan
    const loan = await db.loan.findFirst({
        where: {
            transactions: {
                some: { isReversed: true }
            }
        }
    })

    if (!loan) {
        console.log('No loan with reversals found. Testing with generic loan.')
        const anyLoan = await db.loan.findFirst()
        if (!anyLoan) {
            console.log('No loans found.')
            return
        }
        await testLoan(anyLoan.id)
    } else {
        console.log(`Found Loan with reversals: ${loan.id}`)
        await testLoan(loan.id)
    }
}

async function testLoan(loanId: string) {
    try {
        const statement = await getLoanStatement(loanId)
        console.log(`Transactions for Loan ${loanId}:`)
        console.table(statement.walletTransactions.map(t => ({
            Type: t.type,
            Amount: t.amount,
            Reversed: t.isReversed,
            RunningBalance: t.runningBalance
        })))
    } catch (e) {
        console.error(e)
    }
}

main()
