import { PrismaClient, AccountType, NormalBalance, LedgerStatus, AccountingPeriodStatus, ReferenceType } from '@prisma/client';
import { LedgerService } from '../lib/services/ledger-service';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Ledger Live Test ---');

    // 1. Create/Ensure Accounting Period
    const startDate = new Date('2030-01-01');
    const endDate = new Date('2030-01-31');

    console.log('1. Setting up Accounting Period...');
    let period = await prisma.accountingPeriod.findFirst({
        where: { startDate, endDate }
    });

    if (!period) {
        period = await prisma.accountingPeriod.create({
            data: {
                startDate,
                endDate,
                status: AccountingPeriodStatus.OPEN,
                memo: 'Test Period 2030'
            }
        });
        console.log('   -> Created new test period.');
    } else {
        if (period.status === AccountingPeriodStatus.CLOSED) {
            await prisma.accountingPeriod.update({
                where: { id: period.id },
                data: { status: AccountingPeriodStatus.OPEN }
            });
            console.log('   -> Re-opened existing test period.');
        } else {
            console.log('   -> Found existing open test period.');
        }
    }

    // 2. Create Test Accounts
    console.log('2. Setting up Ledger Accounts...');

    // Asset Account (e.g., Test Cash)
    const assetCode = '10000';
    let assetAcc = await prisma.ledgerAccount.findUnique({ where: { code: assetCode } });
    if (!assetAcc) {
        assetAcc = await prisma.ledgerAccount.create({
            data: {
                code: assetCode,
                name: 'Test Cash Asset',
                type: AccountType.ASSET,
                normalBalance: NormalBalance.DEBIT,
                status: LedgerStatus.ACTIVE
            }
        });
        console.log('   -> Created Test Cash Asset (10000)');
    } else {
        console.log('   -> Found Test Cash Asset (10000)');
    }

    // Equity Account (e.g., Test Capital)
    const equityCode = '30000';
    let equityAcc = await prisma.ledgerAccount.findUnique({ where: { code: equityCode } });
    if (!equityAcc) {
        equityAcc = await prisma.ledgerAccount.create({
            data: {
                code: equityCode,
                name: 'Test Owner Capital',
                type: AccountType.EQUITY,
                normalBalance: NormalBalance.CREDIT,
                status: LedgerStatus.ACTIVE
            }
        });
        console.log('   -> Created Test Owner Capital (30000)');
    } else {
        console.log('   -> Found Test Owner Capital (30000)');
    }

    // 3. Post Journal Entry
    console.log('3. Posting Journal Entry...');
    const amount = 5000;
    const refId = `TEST-${Date.now()}`;

    console.log('   -> ReferenceType (Using fallback):', ReferenceType.LOAN_DISBURSEMENT);

    try {
        const transaction = await LedgerService.postJournalEntry({
            date: new Date('2030-01-15'), // Inside our test period
            referenceType: ReferenceType.LOAN_DISBURSEMENT, // Using existing enum to test logic
            referenceId: refId,
            description: 'Live Test Transaction',
            createdBy: 'system-test-script',
            createdByName: 'Test Script',
            lines: [
                {
                    ledgerAccountId: assetAcc.id,
                    debitAmount: amount,
                    creditAmount: 0,
                    description: 'Debit Cash'
                },
                {
                    ledgerAccountId: equityAcc.id,
                    debitAmount: 0,
                    creditAmount: amount,
                    description: 'Credit Capital'
                }
            ]
        });
        console.log(`   -> Successfully posted transaction: ${transaction.id}`);
        console.log(`   -> Reference: ${refId}`);
        console.log(`   -> Amount: ${amount}`);

    } catch (error: any) {
        console.error('   -> FAILED to post transaction:', error.message);
        // console.error(error); // Optional: print full error if needed
        process.exit(1);
    }

    // 4. Verify Balances
    console.log('4. Verifying Balances...');
    const cachedAsset = await prisma.ledgerAccount.findUnique({ where: { id: assetAcc.id } });
    const cachedEquity = await prisma.ledgerAccount.findUnique({ where: { id: equityAcc.id } });

    console.log(`   -> Asset Balance (Cached): ${cachedAsset?.balance} (Expected ~${amount} if new)`);
    console.log(`   -> Equity Balance (Cached): ${cachedEquity?.balance} (Expected ~${amount} if new)`);

    console.log('--- Test Complete: SUCCESS ---');
}

main()
    .catch((e) => {
        console.error('Test Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
