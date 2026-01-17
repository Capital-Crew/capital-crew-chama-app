
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Latest Transaction ---')
    const tx = await prisma.transaction.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { member: true }
    })

    if (!tx) {
        console.log('No transactions found.')
        return
    }

    console.log(`Transaction ID: ${tx.id}`)
    console.log(`Status: ${tx.status}`)
    console.log(`Amount: ${tx.amount}`)
    console.log(`Phone: ${tx.phoneNumber}`)
    console.log(`CheckoutRequestID: ${tx.checkoutRequestId}`)
    console.log(`Created At: ${tx.createdAt}`)

    if (tx.status === 'COMPLETED') {
        console.log('--- Checking Wallet Balance ---')
        if (tx.member) {
            // Check wallet balance
            const wallet = await prisma.wallet.findUnique({
                where: { memberId: tx.member.id },
                include: { glAccount: true }
            })
            console.log(`Wallet Balance (GL): ${wallet?.glAccount?.balance}`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
