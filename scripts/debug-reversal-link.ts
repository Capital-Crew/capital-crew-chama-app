
import { db } from '@/lib/db'

async function main() {
    const searchTerm = 'CMLNJYYH' // From screenshot
    console.log(`Searching for transaction with ID containing: ${searchTerm}`)

    // Check WalletTransaction
    const walletTx = await db.walletTransaction.findFirst({
        where: {
            OR: [
                { id: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
        },
        include: { relatedLoan: true }
    })

    if (walletTx) {
        console.log('--- Found Wallet Transaction ---')
        console.log(walletTx)

        if (walletTx.relatedLoanId) {
            console.log(`Linked to Loan: ${walletTx.relatedLoanId}`)
            // Find corresponding Loan Transaction
            const loanTx = await db.loanTransaction.findFirst({
                where: {
                    loanId: walletTx.relatedLoanId,
                    // Try to match by amount or reference
                    amount: walletTx.amount,
                    // referenceId: walletTx.id // Maybe?
                }
            })
            console.log('--- Corresponding Loan Transaction Candidates ---')
            const candidates = await db.loanTransaction.findMany({
                where: { loanId: walletTx.relatedLoanId },
                orderBy: { postedAt: 'desc' },
                take: 5
            })
            console.table(candidates.map(c => ({
                id: c.id,
                type: c.type,
                amount: c.amount,
                isReversed: c.isReversed,
                ref: c.referenceId
            })))
        }
        return
    }

    // Check LoanTransaction
    const loanTx = await db.loanTransaction.findFirst({
        where: {
            OR: [
                { id: { contains: searchTerm, mode: 'insensitive' } },
                { referenceId: { contains: searchTerm, mode: 'insensitive' } }
            ]
        }
    })

    if (loanTx) {
        console.log('--- Found Loan Transaction ---')
        console.log(loanTx)
        return
    }

    console.log('Transaction not found in Wallet or Loan tables.')
}

main()
