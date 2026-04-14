import { db } from '../lib/db.js';

async function checkEscrow() {
    const escrow = await db.ledgerAccount.findUnique({
        where: { code: 'ESCROW-CLN' }
    });

    if (escrow) {
        console.log('✅ ESCROW-CLN found:', escrow.id, escrow.name);
    } else {
        console.log('❌ ESCROW-CLN NOT found in ledgerAccount table');
    }

    const mapping = await db.systemAccountingMapping.findFirst({
        where: { type: 'EVENT_CLN_ESCROW' as any }
    });

    if (mapping) {
        console.log('✅ LOAN_ESCROW mapping found');
    } else {
        console.log('❌ LOAN_ESCROW mapping NOT found');
    }
}

checkEscrow().catch(console.error);
