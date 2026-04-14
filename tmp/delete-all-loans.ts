import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('⚠️  DELETING ALL LOANS AND RELATED LEDGER ENTRIES\n')

    const loanCount = await prisma.loan.count()
    console.log(`Found ${loanCount} loans`)
    if (loanCount === 0) {
        console.log('Nothing to delete.')
        return await prisma.$disconnect()
    }

    await prisma.$transaction(async (tx) => {
        // 1. Collect all loan IDs and their transaction IDs
        const loans = await tx.loan.findMany({ select: { id: true, loanApplicationNumber: true } })
        const loanIds = loans.map(l => l.id)
        console.log(`Loans: ${loans.map(l => l.loanApplicationNumber).join(', ')}`)

        const loanTxs = await tx.loanTransaction.findMany({
            where: { loanId: { in: loanIds } },
            select: { id: true }
        })
        const loanTxIds = loanTxs.map(t => t.id)

        // 2. Delete loan child records (FK-safe order)
        const deletes = [
            ['LoanTransaction', tx.loanTransaction.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['RepaymentInstallment', tx.repaymentInstallment.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['InterestPosting', tx.interestPosting.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['InterestEngineRun', tx.interestEngineRun.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['LoanApproval', tx.loanApproval.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['LoanJourneyEvent', tx.loanJourneyEvent.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['WalletTransaction', tx.walletTransaction.deleteMany({ where: { relatedLoanId: { in: loanIds } } })],
            ['GeneralLedger', tx.generalLedger.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['GuarantorMap', tx.guarantorMap.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['LoanTopUp', tx.loanTopUp.deleteMany({ where: { OR: [{ newLoanId: { in: loanIds } }, { oldLoanId: { in: loanIds } }] } })],
            ['LoanHistory', tx.loanHistory.deleteMany({ where: { loanId: { in: loanIds } } })],
            ['LoanSummaryProjection', tx.loanSummaryProjection.deleteMany({})],
            ['LoanDraft', tx.loanDraft.deleteMany({})],
        ] as const

        for (const [name, promise] of deletes) {
            const result = await promise
            console.log(`  ${name}: ${result.count} deleted`)
        }

        // 3. Delete loan records
        const loanDel = await tx.loan.deleteMany({})
        console.log(`  Loan: ${loanDel.count} deleted`)

        // 4. Delete ledger entries linked to loan transactions (precise match via externalReferenceId)
        console.log('\n--- Ledger cleanup (precise match) ---')

        // Find ledger transactions linked by externalReferenceId OR referenceId to loan transaction IDs
        const linkedLedgerTxs = await tx.ledgerTransaction.findMany({
            where: {
                OR: [
                    { externalReferenceId: { in: loanTxIds } },
                    { referenceId: { in: loanTxIds } },
                    // Also catch reversals that reference other reversals
                    { referenceType: { in: ['LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_PENALTY', 'LOAN_FEE', 'LOAN_INTEREST', 'LOAN_WAIVER'] } },
                ]
            },
            select: { id: true }
        })

        // Also find reversal entries that point to any of the above
        const primaryIds = linkedLedgerTxs.map(t => t.id)
        const reversalTxs = await tx.ledgerTransaction.findMany({
            where: {
                OR: [
                    { reversalOf: { in: primaryIds } },
                    { reversedBy: { in: primaryIds } },
                ]
            },
            select: { id: true }
        })

        const allLedgerTxIds = [...new Set([...primaryIds, ...reversalTxs.map(t => t.id)])]
        console.log(`  Found ${allLedgerTxIds.length} loan-related ledger transactions`)

        if (allLedgerTxIds.length > 0) {
            // Clear reversal links first to avoid FK issues
            await tx.ledgerTransaction.updateMany({
                where: { id: { in: allLedgerTxIds } },
                data: { reversalOf: null, reversedBy: null }
            })

            const entryDel = await tx.ledgerEntry.deleteMany({ where: { transactionId: { in: allLedgerTxIds } } })
            console.log(`  LedgerEntry: ${entryDel.count} deleted`)

            const txDel = await tx.ledgerTransaction.deleteMany({ where: { id: { in: allLedgerTxIds } } })
            console.log(`  LedgerTransaction: ${txDel.count} deleted`)
        }

        // 5. Recalculate GL balances from remaining entries
        console.log('\n--- Recalculating GL balances ---')
        const accounts = await tx.ledgerAccount.findMany({ select: { id: true, code: true, name: true } })

        let changed = 0
        for (const account of accounts) {
            const agg = await tx.ledgerEntry.aggregate({
                where: { ledgerAccountId: account.id },
                _sum: { debitAmount: true, creditAmount: true }
            })
            const balance = Number(agg._sum.debitAmount || 0) - Number(agg._sum.creditAmount || 0)
            await tx.ledgerAccount.update({ where: { id: account.id }, data: { balance } })
            changed++
        }
        console.log(`  Recalculated ${changed} account balances`)

    }, {
        maxWait: 10000,
        timeout: 120000,
    })

    console.log('\n✅ All loans and related ledger entries deleted successfully.')
    await prisma.$disconnect()
}

main().catch(e => { console.error('❌ Error:', e); prisma.$disconnect(); process.exit(1) })
