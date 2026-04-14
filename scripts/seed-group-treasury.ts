import { db } from '../lib/db.js';

async function seedGroupTreasury() {
    console.log('🚀 Seeding Group Treasury Infrastructure...');
    try {
        // 1. Create the GL Account
        const treasuryAccount = await db.ledgerAccount.upsert({
            where: { code: 'GROUP-TREASURY' },
            update: {},
            create: {
                code: 'GROUP-TREASURY',
                name: 'Group Treasury Pooled Funds',
                type: 'LIABILITY',
                normalBalance: 'CREDIT',
                status: 'ACTIVE',
                isSystemAccount: true,
                isManualPostingAllowed: false,
                description: 'Pooled funds belonging to the group treasury for investments'
            }
        });
        console.log('✅ Ledger Account GROUP-TREASURY ready:', treasuryAccount.id);

        // 2. Update all Group Wallets to point to this GL account
        const updatedCount = await db.groupWallet.updateMany({
            data: {
                glAccountId: treasuryAccount.id
            }
        });
        console.log(`✅ Linked ${updatedCount.count} Group Wallets to Treasury GL`);

        console.log('\n✨ Group Treasury Infrastructure Seeded Successfully!');
    } catch (err) {
        console.error('❌ Seeding Failed with Error:');
        console.error(err);
        process.exit(1);
    }
}

seedGroupTreasury().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
