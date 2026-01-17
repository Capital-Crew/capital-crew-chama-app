
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🐞 Debugging Registration...')

    const liabilityAccount = await prisma.ledgerAccount.findUnique({ where: { code: '2000' } })
    if (!liabilityAccount) throw new Error("Acc 2000 missing")

    console.log('1. Creating Member Only...')
    let memberId = ''
    try {
        const member = await prisma.member.create({
            data: {
                memberNumber: Math.floor(Math.random() * 1000000),
                name: "Debug Member",
                // identifiers: { create: { type: 'NATIONAL_ID', value: '123' } } // Commented out to test basic create
            }
        })
        console.log('   ✅ Member created:', member.id)
        memberId = member.id
    } catch (e: any) {
        console.error('   ❌ Member Create Failed:', e.message)
        return
    }

    console.log('2. Creating Shared Wallet...')
    try {
        const w1 = await prisma.wallet.create({
            data: {
                memberId,
                accountRef: `WAL-${Math.floor(Math.random() * 1000)}`,
                glAccountId: liabilityAccount.id,
                status: 'ACTIVE'
            }
        })
        console.log('   ✅ Wallet 1 created')

        const w2 = await prisma.wallet.create({
            data: {
                memberId: memberId, // Use same member? No memberId is unique.
                // Need new member for correct schema usually? 
                // Wallet.memberId is unique. So I can't create 2 wallets for same member.
                // But I can create 2 wallets for DIFFERENT members linked to SAME glAccount.
            }
        })
    } catch (e) {
        // ...
    }

    // Test 2 Wallets, Same GL Account, Diff Members
    console.log('3. Testing 2 Wallets, Same GL Account...')
    try {
        const m2 = await prisma.member.create({
            data: { memberNumber: Math.floor(Math.random() * 1000000), name: "Debug Member 2" }
        })

        const w2 = await prisma.wallet.create({
            data: {
                memberId: m2.id,
                accountRef: `WAL-${Math.floor(Math.random() * 1000)}`,
                glAccountId: liabilityAccount.id, // Shared Account
                status: 'ACTIVE'
            }
        })
        console.log('   ✅ Wallet 2 created (Shared GL works!)')
    } catch (e: any) {
        console.error('   ❌ Wallet 2 Create Failed:', e.message)
        console.error('   Code:', e.code)
        console.error('   Meta:', e.meta)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
