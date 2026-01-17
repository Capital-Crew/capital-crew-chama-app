
import { db } from '@/lib/db';

async function main() {
    console.log('🔍 Checking Account 1200 Configuration...');
    const account = await db.account.findUnique({
        where: { code: '1200' }
    });

    if (!account) {
        console.log('❌ Account 1200 not found!');
    } else {
        console.log('✅ Account 1200 found:', account);
        // Also check if any system mapping exists
        const mapping = await db.systemAccountingMapping.findFirst({
            where: { accountId: account.id },
            include: { account: true }
        });
        console.log('Start Mapping:', mapping);
    }
}

main();
