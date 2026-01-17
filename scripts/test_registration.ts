
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Testing Atomic Registration & Schema Constraints...')

    // 1. Get Liability Account
    const liabilityAccount = await prisma.ledgerAccount.findUnique({
        where: { code: '2000' }
    })

    if (!liabilityAccount) throw new Error("Liability Account 2000 not found!")
    console.log(`✅ Found Liability Account: ${liabilityAccount.name} (${liabilityAccount.id})`)

    // 2. Simulate Registration 1
    console.log('--- Registering Member A ---')
    const walletIdA = `WAL-TEST-${Math.floor(Math.random() * 10000)}`
    const memberNumA = Math.floor(Math.random() * 100000)

    const resultA = await prisma.$transaction(async (tx) => {
        const member = await tx.member.create({
            data: {
                memberNumber: memberNumA,
                name: "Test Member A",
                contact: "0700000000",
                status: 'PENDING',
                // Minimal required fields
                identifiers: {
                    create: { type: 'NATIONAL_ID', value: `ID-${memberNumA}` }
                }
            }
        })

        const wallet = await tx.wallet.create({
            data: {
                memberId: member.id,
                accountRef: walletIdA,
                glAccountId: liabilityAccount.id, // Linking to 2000
                status: 'ACTIVE'
            }
        })
        return { member, wallet }
    })
    console.log(`✅ Created Member A (#${resultA.member.memberNumber}) with Wallet linked to ${liabilityAccount.code}`)


    // 3. Simulate Registration 2 (Should succeed if Unique Constraint is gone)
    console.log('--- Registering Member B ---')
    const walletIdB = `WAL-TEST-${Math.floor(Math.random() * 10000)}`
    const memberNumB = memberNumA + 1

    try {
        const resultB = await prisma.$transaction(async (tx) => {
            const member = await tx.member.create({
                data: {
                    memberNumber: memberNumB,
                    name: "Test Member B",
                    contact: "0700000001",
                    status: 'PENDING',
                    identifiers: {
                        create: { type: 'NATIONAL_ID', value: `ID-${memberNumB}` }
                    }
                }
            })

            const wallet = await tx.wallet.create({
                data: {
                    memberId: member.id,
                    accountRef: walletIdB,
                    glAccountId: liabilityAccount.id, // Linking to SAME 2000
                    status: 'ACTIVE'
                }
            })
            return { member, wallet }
        })
        console.log(`✅ Created Member B (#${resultB.member.memberNumber}) with Wallet linked to ${liabilityAccount.code}`)
        console.log("🎉 SUCCESS: Multiple wallets mapped to single Liability Account.")

    } catch (e: any) {
        console.error("❌ FAILED: Could not create second wallet linked to same account.")
        console.error("Error Message:", e.message)
        console.error("Error Code:", e.code)
        console.error("Error Meta:", e.meta)
        process.exit(1)
    }

    // Cleanup
    console.log('--- Cleaning Up ---')
    // We need to delete mostly for re-run capability, but user said "Delete even used ones" earlier so maybe leave it?
    // Nah, better clean up test data.
    await prisma.member.deleteMany({
        where: { id: { in: [resultA.member.id, resultA?.member?.id] } } // Cascades to wallet
    })
    // Actually resultB might not exist if failed, handled implicitly if I used let.
    // Simpler cleanup:
    await prisma.walletTransaction.deleteMany({ where: { wallet: { accountRef: { in: [walletIdA, walletIdB] } } } })
    await prisma.wallet.deleteMany({ where: { accountRef: { in: [walletIdA, walletIdB] } } })
    await prisma.member.deleteMany({ where: { memberNumber: { in: [memberNumA, memberNumB] } } })
    console.log('✅ Changes Reverted.')
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
