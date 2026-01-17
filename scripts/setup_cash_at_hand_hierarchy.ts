
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Setting up "Cash at Hand" Core Ledger Hierarchy...')

    // 1. Create or Find the Root "Cash at Hand" (Liability) Account
    const rootCode = '6000'
    const rootName = 'Cash at Hand (Net Liability)'

    let rootAccount = await prisma.ledgerAccount.findUnique({
        where: { code: rootCode }
    })

    if (!rootAccount) {
        rootAccount = await prisma.ledgerAccount.create({
            data: {
                code: rootCode,
                name: rootName,
                type: 'LIABILITY', // As requested
                isActive: true,
                allowManualEntry: false // It's a control account
            }
        })
        console.log(`Created Root Account: ${rootCode} - ${rootName}`)
    } else {
        console.log(`Root Account exists: ${rootCode}`)
        // Ensure it is Liability if mistakenly Asset? 
        if (rootAccount.type !== 'LIABILITY') {
            await prisma.ledgerAccount.update({ where: { id: rootAccount.id }, data: { type: 'LIABILITY' } })
            console.log('Updated Root Account to LIABILITY.')
        }
    }

    const rootId = rootAccount.id

    // 2. Identify Children to Reparent
    // A) Member Wallet (Control Account)
    const walletMapping = await prisma.systemAccountingMapping.findUnique({ where: { type: 'MEMBER_WALLET' }, include: { account: true } })
    if (walletMapping) {
        await prisma.ledgerAccount.update({
            where: { id: walletMapping.accountId },
            data: { parentId: rootId }
        })
        console.log(`Linked Member Wallet Control (${walletMapping.account.code}) to Root.`)
    } else {
        console.warn('MEMBER_WALLET mapping not found.')
    }

    // B) Cash / Mpesa (Cash on Hand)
    // Checking system mapping for CASH_ON_HAND
    const cashMapping = await prisma.systemAccountingMapping.findUnique({ where: { type: 'CASH_ON_HAND' }, include: { account: true } })
    if (cashMapping) {
        await prisma.ledgerAccount.update({
            where: { id: cashMapping.accountId },
            data: { parentId: rootId }
        })
        console.log(`Linked Cash/Mpesa (${cashMapping.account.code}) to Root.`)
    } else {
        // Fallback: search by Code 1000
        const cashAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1000' } })
        if (cashAcc) {
            await prisma.ledgerAccount.update({
                where: { id: cashAcc.id },
                data: { parentId: rootId }
            })
            console.log(`Linked Account 1000 (Cash?) to Root.`)
        }
    }

    // C) Bank Subledger
    // Search for "Bank" in name
    const bankAccounts = await prisma.ledgerAccount.findMany({
        where: { name: { contains: 'Bank', mode: 'insensitive' } }
    })

    for (const bank of bankAccounts) {
        if (bank.id === rootId) continue
        await prisma.ledgerAccount.update({
            where: { id: bank.id },
            data: { parentId: rootId }
        })
        console.log(`Linked Bank Account (${bank.code} - ${bank.name}) to Root.`)
    }

    // D) Search for "Mpesa" specifically if separate from Cash
    const mpesaAccounts = await prisma.ledgerAccount.findMany({
        where: { name: { contains: 'Mpesa', mode: 'insensitive' } }
    })
    for (const mpesa of mpesaAccounts) {
        if (mpesa.id === rootId) continue
        // Avoid double reparenting if it was mapped to CASH_ON_HAND
        if (cashMapping && mpesa.id === cashMapping.accountId) continue

        await prisma.ledgerAccount.update({
            where: { id: mpesa.id },
            data: { parentId: rootId }
        })
        console.log(`Linked Mpesa Account (${mpesa.code} - ${mpesa.name}) to Root.`)
    }


    console.log('Hierarchy Setup Complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
