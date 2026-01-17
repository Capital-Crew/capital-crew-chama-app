
import { db } from '../lib/db'

async function fixAccountType() {
    console.log('=== FIXING ACCOUNT 1200 TYPE ===')

    // 1. Check current state
    const account = await db.account.findUnique({ where: { code: '1200' } })
    console.log('Current State:', account)

    if (account?.type === 'ASSET') {
        console.log('Updating Account 1200 to EQUITY...')
        await db.account.update({
            where: { code: '1200' },
            data: { type: 'EQUITY' }
        })
        console.log('Update complete.')
    } else {
        console.log('Account is not ASSET, no change needed (or already fixed).')
    }

    // 2. Check Mappings
    console.log('\n=== CHECKING APP MAPPINGS ===')
    const mappings = await db.systemAccountingMapping.findMany({
        include: { account: true }
    })

    mappings.forEach(m => {
        console.log(`Mapping: ${m.type} -> Account: ${m.account.code} (${m.account.name})`)
    })

    await db.$disconnect()
}

fixAccountType().catch(console.error)
