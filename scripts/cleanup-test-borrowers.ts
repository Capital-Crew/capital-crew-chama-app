
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Starting cleanup of "Borrower Test" members...')

    // 1. Find the members
    const members = await prisma.member.findMany({
        where: {
            name: 'Borrower Test'
        },
        select: { id: true }
    })

    if (members.length === 0) {
        console.log('✨ No "Borrower Test" members found.')
        return
    }

    const memberIds = members.map(m => m.id)
    console.log(`Found ${memberIds.length} members to delete.`)

    // 2. Delete related data (Children first to avoid FK violations)
    // Dependencies:
    // Member -> Wallet -> WalletTransaction
    // Member -> Loan -> LoanJourneyEvent, LoanApproval, etc.
    // Member -> Notification

    console.log('...Deleting Wallet Transactions')
    await prisma.walletTransaction.deleteMany({
        where: {
            wallet: {
                memberId: { in: memberIds }
            }
        }
    })

    console.log('...Deleting Notifications')
    await prisma.notification.deleteMany({
        where: { memberId: { in: memberIds } }
    })

    console.log('...Deleting Loan Dependencies (JourneyEvents, Approvals, InterestPostings, TopUps)')
    const loans = await prisma.loan.findMany({ where: { memberId: { in: memberIds } }, select: { id: true } })
    const loanIds = loans.map(l => l.id)

    console.log('...Deleting Loan Sub-records (Transactions, Guarantors, Installments)')
    if (loanIds.length > 0) {
        await prisma.loanJourneyEvent.deleteMany({ where: { loanId: { in: loanIds } } })
        await prisma.loanApproval.deleteMany({ where: { loanId: { in: loanIds } } })
        await prisma.interestPosting.deleteMany({ where: { loanId: { in: loanIds } } })

        // Loan Transaction (The one that failed)
        await prisma.loanTransaction.deleteMany({ where: { loanId: { in: loanIds } } })

        // Guarantors
        await prisma.guarantorMap.deleteMany({ where: { loanId: { in: loanIds } } })

        // Repayment Installments
        await prisma.repaymentInstallment.deleteMany({ where: { loanId: { in: loanIds } } })

        // General Ledger (Legacy/Hybrid)
        await prisma.generalLedger.deleteMany({ where: { loanId: { in: loanIds } } })

        // TopUps: check both newLoanId and oldLoanId
        await prisma.loanTopUp.deleteMany({
            where: {
                OR: [
                    { newLoanId: { in: loanIds } },
                    { oldLoanId: { in: loanIds } }
                ]
            }
        })
    }

    console.log('...Deleting Loans')
    await prisma.loan.deleteMany({
        where: { memberId: { in: memberIds } }
    })

    console.log('...Deleting Wallets')
    await prisma.wallet.deleteMany({
        where: { memberId: { in: memberIds } }
    })

    // If there were any users linked to these members (unlikely for this test script but good practice)
    console.log('...Deleting Linked Users')
    await prisma.user.deleteMany({
        where: { memberId: { in: memberIds } }
    })

    // Finally delete members
    console.log('...Deleting Members')
    const deletedMembers = await prisma.member.deleteMany({
        where: { id: { in: memberIds } }
    })

    console.log(`✅ Successfully deleted ${deletedMembers.count} borrowers and their data.`)
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
