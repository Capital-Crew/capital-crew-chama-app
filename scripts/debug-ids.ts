
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // The ID from the ledger entry
    const targetId = 'cmkt8hk4l0007tmjova32q9rh'

    console.log(`Investigating ID: ${targetId}`)

    const member = await prisma.member.findUnique({ where: { id: targetId } })
    if (member) console.log('✅ Found as MEMBER:', member.name)
    else console.log('❌ Not a Member')

    const wallet = await prisma.wallet.findUnique({ where: { id: targetId } })
    if (wallet) console.log('✅ Found as WALLET:', wallet.walletNumber)
    else console.log('❌ Not a Wallet')

    const user = await prisma.user.findUnique({ where: { id: targetId } })
    if (user) console.log('✅ Found as USER:', user.email)
    else console.log('❌ Not a User')

    const shareTx = await prisma.shareTransaction.findUnique({ where: { id: targetId } })
    if (shareTx) console.log('✅ Found as SHARE TRANSACTION')
    else console.log('❌ Not a Share Transaction')

    const loan = await prisma.loan.findUnique({ where: { id: targetId } })
    if (loan) console.log('✅ Found as LOAN')
    else console.log('❌ Not a Loan')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
