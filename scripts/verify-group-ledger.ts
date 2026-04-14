import { db } from '../lib/db.js';

async function verifyGroupLedger() {
    console.log('🔍 Verifying Group Ledger Integration...');

    // 1. Check Ledger Account Presence
    const treasury = await db.ledgerAccount.findUnique({
        where: { code: 'GROUP-TREASURY' }
    });

    if (treasury) {
        console.log('✅ Found Group Treasury GL Account:', treasury.id);
    } else {
        console.error('❌ Group Treasury GL Account NOT found');
    }

    // 2. Check Wallet Linkage
    const walletsWithGL = await db.groupWallet.findMany({
        where: { NOT: { glAccountId: null } }
    });

    console.log(`📊 Group Wallets with GL Linkage: ${walletsWithGL.length}`);

    // 3. Verify specific relations
    if (walletsWithGL.length > 0) {
        const first = walletsWithGL[0];
        console.log(`✅ Example mapping: Group ${first.groupId} -> GL ${first.glAccountId}`);
    }

    console.log('\n✨ Verification Complete!');
}

verifyGroupLedger().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
