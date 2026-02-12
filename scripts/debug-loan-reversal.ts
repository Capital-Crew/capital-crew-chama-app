
import { PrismaClient } from '@prisma/client'
import { getLoanStatement } from '../app/actions/getLoanStatement'

const prisma = new PrismaClient()

async function main() {
    console.log("Debugging Loan Reversal...")

    // 1. Find the loan for "System Administrator" (Member #4)
    // The screenshot shows Member #4.
    const loan = await prisma.loan.findFirst({
        where: {
            loanApplicationNumber: 'LN013'
            // active or cleared? Status might be active.
        },
        include: {
            member: true,
            loanProduct: true,
            transactions: {
                orderBy: { postedAt: 'desc' },
                take: 5
            }
        }
    })

    if (!loan) {
        console.error("Loan not found for Member #4")
        return
    }

    console.log(`Found Loan: ${loan.loanApplicationNumber} (${loan.id})`)
    console.log(`Current Transactions (Last 5):`)

    for (const tx of loan.transactions) {
        console.log(`- [${tx.postedAt.toISOString()}] ${tx.type} ${tx.amount} | isReversed: ${tx.isReversed} | ID: ${tx.id} | Desc: ${tx.description}`)
    }

    // 2. Check getLoanStatement output
    console.log("\nChecking getLoanStatement Output:")
    const statement = await getLoanStatement(loan.id)
    const reversedTxs = statement.walletTransactions.filter((tx: any) => tx.isReversed)

    console.log(`Total Statement Txs: ${statement.walletTransactions.length}`)
    console.log(`Reversed Txs in Statement: ${reversedTxs.length}`)

    if (reversedTxs.length > 0) {
        console.log("Reversed Transactions found in Server Action output:")
        reversedTxs.forEach((tx: any) => console.log(`- ${tx.description} (${tx.amount})`))
    } else {
        console.log("No reversed transactions found in Server Action output.")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
