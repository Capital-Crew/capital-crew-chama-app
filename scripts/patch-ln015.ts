
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Patching LN015 Reversals ---')

    // 1. Get All Ledger Transactions created today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const ledgerTxs = await prisma.ledgerTransaction.findMany({
        where: {
            postedAt: { gte: startOfDay }
        },
        include: { ledgerEntries: true }
    })

    console.log(`Found ${ledgerTxs.length} Ledger Transactions today.`)

    // 2. Identify Reversals by type or description
    // The screenshot says "Reversal: Loan repayment withdrawal"
    // The type in DB for reversal entries might be 'REVERSAL' or 'MANUAL_ADJUSTMENT' depending on code version
    // But typically we look for `referenceType: 'REVERSAL'` if modern code ran.
    // If old code ran, it might rely on specific descriptions.

    const potentialReversals = ledgerTxs.filter(tx =>
        tx.description.toLowerCase().includes('reversal') ||
        tx.referenceType === 'REVERSAL'
    )

    console.log(`Found ${potentialReversals.length} potential Reversal Tx in Ledger.`)

    for (const ltx of potentialReversals) {
        console.log(`Ledger Tx: ${ltx.id} | Desc: ${ltx.description} | Ref: ${ltx.referenceId} | RefType: ${ltx.referenceType}`)

        // If RefType is REVERSAL and RefId points to a LoanTransaction...
        if (ltx.referenceType === 'REVERSAL' && ltx.referenceId) {
            const loanTx = await prisma.loanTransaction.findUnique({
                where: { id: ltx.referenceId }
            })

            if (loanTx) {
                if (!loanTx.isReversed) {
                    console.log(`[FOUND MISMATCH] Ledger Reversal ${ltx.id} points to Active LoanTx ${loanTx.id}. Fixing...`)

                    // FIX 1: Mark as Reversed
                    await prisma.loanTransaction.update({
                        where: { id: loanTx.id },
                        data: { isReversed: true, reversedAt: new Date() }
                    })

                    // FIX 2: Create Contra Entry if missing
                    const existingContra = await prisma.loanTransaction.findFirst({
                        where: { loanId: loanTx.loanId, type: 'REVERSAL', referenceId: loanTx.id }
                    })

                    if (!existingContra) {
                        console.log(`Creating Contra Entry for ${loanTx.id}...`)
                        await prisma.loanTransaction.create({
                            data: {
                                loanId: loanTx.loanId,
                                type: 'REVERSAL',
                                amount: loanTx.amount,
                                principalAmount: loanTx.principalAmount,
                                interestAmount: loanTx.interestAmount,
                                penaltyAmount: loanTx.penaltyAmount,
                                feeAmount: loanTx.feeAmount,
                                description: `Reversal: ${loanTx.type} (Patch)`,
                                referenceId: loanTx.id,
                                postedAt: new Date(),
                                transactionDate: new Date(),
                                isReversed: false
                            }
                        })
                    }
                } else {
                    console.log(`LoanTx ${loanTx.id} is already reversed. Checking Contra...`)
                    // Check Contra
                    const existingContra = await prisma.loanTransaction.findFirst({
                        where: { loanId: loanTx.loanId, type: 'REVERSAL', referenceId: loanTx.id }
                    })
                    if (!existingContra) {
                        console.log(`Creating Contra Entry for ${loanTx.id}...`)
                        await prisma.loanTransaction.create({
                            data: {
                                loanId: loanTx.loanId,
                                type: 'REVERSAL',
                                amount: loanTx.amount,
                                principalAmount: loanTx.principalAmount,
                                interestAmount: loanTx.interestAmount,
                                penaltyAmount: loanTx.penaltyAmount,
                                feeAmount: loanTx.feeAmount,
                                description: `Reversal: ${loanTx.type} (Patch)`,
                                referenceId: loanTx.id,
                                postedAt: new Date(),
                                transactionDate: new Date(),
                                isReversed: false
                            }
                        })
                    }
                }
            } else {
                console.log(`Warning: Reference ID ${ltx.referenceId} not found in LoanTransactions. Checking if it's a Loan ID...`)
                // Check if it is the Loan ID
                const loan = await prisma.loan.findUnique({ where: { id: ltx.referenceId } })

                if (loan) {
                    console.log(`Match! Reference ID is Loan ID: ${loan.loanApplicationNumber}`)
                    const amount = Number(ltx.totalAmount)
                    console.log(`Looking for Loan Tx with Amount: ${amount} (Total Ledger Amount)...`)

                    // Match by Amount and Date (approx)
                    const candidateTx = await prisma.loanTransaction.findFirst({
                        where: {
                            loanId: loan.id,
                            amount: amount,
                            type: 'REPAYMENT',
                            isReversed: false
                        }
                    })

                    if (candidateTx) {
                        console.log(`[FUZZY MATCH] Found Candidate Tx: ${candidateTx.id} (${candidateTx.amount})`)
                        console.log(`Fixing Loan Tx ${candidateTx.id}...`)

                        // FIX 1: Mark as Reversed
                        await prisma.loanTransaction.update({
                            where: { id: candidateTx.id },
                            data: { isReversed: true, reversedAt: new Date() }
                        })

                        // FIX 2: Create Contra Entry
                        await prisma.loanTransaction.create({
                            data: {
                                loanId: candidateTx.loanId,
                                type: 'REVERSAL',
                                amount: candidateTx.amount,
                                principalAmount: candidateTx.principalAmount,
                                interestAmount: candidateTx.interestAmount,
                                penaltyAmount: candidateTx.penaltyAmount,
                                feeAmount: candidateTx.feeAmount,
                                description: `Reversal: ${candidateTx.type} (Patch - ID Mismatch)`,
                                referenceId: candidateTx.id,
                                postedAt: new Date(),
                                transactionDate: new Date(),
                                isReversed: false
                            }
                        })
                        console.log(`Fixed successfully.`)
                    } else {
                        console.log(`No active repayment transaction found with amount ${amount} for this loan.`)
                    }
                }
            }
        }
    }
}

main()
