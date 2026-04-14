import { db } from '@/lib/db';

async function auditCLN() {
  console.log('--- CLN Module Audit ---');
  
  // 1. Check for system accounts
  const escrowAccount = await db.ledgerAccount.findUnique({
    where: { code: 'ESCROW-CLN' }
  });
  
  if (!escrowAccount) {
    console.warn('[MISSING] LedgerAccount: ESCROW-CLN');
  } else {
    console.log('[OK] LedgerAccount: ESCROW-CLN found');
  }

  // 2. Check for system mappings
  const escrowMapping = await db.systemAccountingMapping.findUnique({
    where: { type: 'EVENT_CLN_ESCROW' as any }
  });

  if (!escrowMapping) {
    console.warn('[MISSING] SystemAccountingMapping: EVENT_CLN_ESCROW');
  } else {
    console.log('[OK] SystemAccountingMapping: EVENT_CLN_ESCROW found');
  }

  // 3. Count notes by status
  const statuses = await db.loanNote.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log('Loan Note Statuses:', statuses);
}

auditCLN().catch(console.error);
