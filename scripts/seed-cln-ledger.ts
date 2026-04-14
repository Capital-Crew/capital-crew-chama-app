import { db } from '../lib/db.js';

async function seedCLN() {
    console.log('🚀 Seeding CLN Accounting Infrastructure...');
    try {
        // 1. Create the GL Account
        const escrowAccount = await db.ledgerAccount.upsert({
            where: { code: 'ESCROW-CLN' },
            update: {},
            create: {
                code: 'ESCROW-CLN',
                name: 'Loan Note Escrow (CLN)',
                type: 'LIABILITY',
                normalBalance: 'CREDIT',
                status: 'ACTIVE',
                isSystemAccount: true,
                isManualPostingAllowed: false,
                description: 'Funds held in escrow for Loan Note subscriptions'
            }
        });
        console.log('✅ Ledger Account ESCROW-CLN ready:', escrowAccount.id);

        // 2. Create the System Mapping
        // Note: Using EVENT_CLN_ESCROW as added to SystemAccountType enum
        await db.systemAccountingMapping.upsert({
            where: { type: 'EVENT_CLN_ESCROW' as any },
            update: { accountId: escrowAccount.id },
            create: {
                type: 'EVENT_CLN_ESCROW' as any,
                accountId: escrowAccount.id
            }
        });
        console.log('✅ System Mapping EVENT_CLN_ESCROW ready');

        console.log('\n✨ CLN Infrastructure Seeded Successfully!');
    } catch (err) {
        console.error('❌ Seeding Failed with Error:');
        console.error(err);
        process.exit(1);
    }
}

seedCLN().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
