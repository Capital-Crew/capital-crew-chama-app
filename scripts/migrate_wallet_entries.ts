
import { PrismaClient } from '@prisma/client'
import { WalletService } from '../lib/services/WalletService'

const prisma = new PrismaClient()

async function main() {
    console.log('Migrating Wallet Entries to Unique Accounts...')

    // 1. Get Global Member Wallet Account
    const mapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'MEMBER_WALLET' }
    })

    if (!mapping) {
        console.error('No MEMBER_WALLET mapping found!')
        return
    }

    const globalAccountId = mapping.accountId
    console.log(`Global Wallet Account ID: ${globalAccountId}`)

    // 2. Iterate all members with wallets
    // Or just all members
    const members = await prisma.member.findMany({
        include: { wallet: true }
    })

    console.log(`Found ${members.length} members.`)

    for (const member of members) {
        console.log(`Processing ${member.name} (${member.id})...`)

        // Ensure Wallet Exists (and has unique account)
        // We can't use WalletService directly easily if it requires complex context, but it seems static.
        // We'll trust existing wallet or create.

        let wallet = member.wallet
        if (!wallet) {
            console.log(' - Creating missing wallet...')
            // We use the service which handles LedgerAccount creation
            wallet = await WalletService.createWallet(member.id)
        }

        if (wallet.glAccountId === globalAccountId) {
            console.warn(` - Wallet ${wallet.accountRef} points to GLOBAL account. This might be legacy. Creating new unique account?`)
            // If the wallet explicitly points to Global, we should probably migrate it to a new Unique account
            // But for now, let's assume WalletService.createWallet created a UNIQUE one (if it didn't exist).
            // If it existed and pointed to Global, we have a problem.
            // Let's check the code of WalletService again. It creates a NEW ledger account.
            // So if wallet.glAccountId == globalAccountId, it was created manually or incorrectly.

            // Fix: Create new LedgerAccount and update Wallet
            const accountCode = `WAL-${member.memberNumber.toString().padStart(6, '0')}`
            const newAccount = await prisma.ledgerAccount.create({
                data: {
                    code: accountCode,
                    name: `Wallet - ${member.name}`,
                    type: 'LIABILITY',
                    isActive: true
                }
            })

            wallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: { glAccountId: newAccount.id, accountRef: accountCode }
            })
            console.log(` - Fixed Wallet to point to new account ${newAccount.id}`)
        }

        const personalAccountId = wallet.glAccountId

        // 3. Find Global Entries for this member (by Reference ID)
        // This covers Deposits and Contributions usually
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                ledgerAccountId: globalAccountId,
                ledgerTransaction: {
                    referenceId: member.id
                }
            }
        })

        if (entries.length > 0) {
            console.log(` - Found ${entries.length} entries in Global Account. Moving...`)

            const updated = await prisma.ledgerEntry.updateMany({
                where: {
                    id: { in: entries.map(e => e.id) }
                },
                data: {
                    ledgerAccountId: personalAccountId
                }
            })
            console.log(` - Moved ${updated.count} entries.`)
        } else {
            console.log(' - No global entries found.')
        }
    }

    console.log('Migration Complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
