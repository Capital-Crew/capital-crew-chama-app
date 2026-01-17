
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Linking Wallets to Global Parent Account...')

    // 1. Get Global Member Wallet Account
    const mapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'MEMBER_WALLET' },
        include: { account: true }
    })

    if (!mapping) {
        console.error('No MEMBER_WALLET mapping found!')
        return
    }

    const parentId = mapping.accountId
    console.log(`Global Wallet Account: ${mapping.account.code} - ${mapping.account.name} (${parentId})`)

    // 2. Iterate all wallets
    const wallets = await prisma.wallet.findMany({
        include: { glAccount: true }
    })

    console.log(`Found ${wallets.length} wallets.`)

    let updatedCount = 0

    for (const wallet of wallets) {
        const account = wallet.glAccount
        if (!account) {
            console.warn(`Wallet ${wallet.id} has no ledger account!`)
            continue
        }

        // If it's already the global account (legacy), skip or warn
        if (account.id === parentId) {
            console.warn(` - Wallet for Member ${wallet.memberId} points to GLOBAL account. Run migration first.`)
            continue
        }

        // Check if parent is already set
        if (account.parentId === parentId) {
            // console.log(` - ${account.code} already linked.`)
            continue
        }

        // Update hierarchy
        await prisma.ledgerAccount.update({
            where: { id: account.id },
            data: { parentId: parentId }
        })
        console.log(` - Linked ${account.code} (${account.name}) to Parent.`)
        updatedCount++
    }

    console.log(`Link Complete. Updated ${updatedCount} accounts.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
