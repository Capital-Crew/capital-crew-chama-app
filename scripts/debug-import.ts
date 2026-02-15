
import { db } from '@/lib/db'
import { getLoanStatement } from '@/app/actions/getLoanStatement'

async function main() {
    console.log('--- Debug Import ---')
    console.log('Function Source (FULL):\n', getLoanStatement.toString())

    // Use real ID
    const loan = await db.loan.findFirst({
        where: { loanApplicationNumber: 'LN015' }
    })

    if (!loan) {
        console.log('Loan LN015 not found')
        return
    }

    console.log('Running function with ID:', loan.id)
    try {
        const result = await getLoanStatement(loan.id)
        console.log('Result Keys:', Object.keys(result || {}))
    } catch (e) {
        console.log('Error running function:', e)
    }
}

main()
