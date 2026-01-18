
import { db } from '@/lib/db';
import { SystemAccountType, AccountType } from '@prisma/client';

const DEFAULTS: Record<string, string> = {
    CASH_ON_HAND: '1100',
    CONTRIBUTIONS_LOANS: '1200',
    LOAN_RECEIVABLES: '1300',
    MEMBER_WALLET: '2200',
    LOAN_INCOME: '4100'
};

const EXPECTED_TYPES: Record<string, AccountType> = {
    CASH_ON_HAND: 'ASSET',
    CONTRIBUTIONS_LOANS: 'ASSET', // Hybrid, but primary nature is Asset
    LOAN_RECEIVABLES: 'ASSET',
    MEMBER_WALLET: 'LIABILITY',
    LOAN_INCOME: AccountType.REVENUE
};

async function main() {
    console.log('🔍 Starting System Account Configuration Audit...\n');

    // Get all system types from known list (Enum not easily iterable at runtime without helper)
    const types = Object.keys(EXPECTED_TYPES) as SystemAccountType[];

    for (const type of types) {
        let accountId: string | undefined;
        let method = 'DEFAULT';

        // 1. Check DB Mapping
        const mapping = await db.systemAccountingMapping.findUnique({
            where: { type },
            include: { account: true }
        });

        let account;

        if (mapping) {
            account = mapping.account;
            method = 'MAPPED';
        } else {
            // 2. Check Default Code
            const code = DEFAULTS[type];
            if (code) {
                account = await db.ledgerAccount.findUnique({ where: { code } });
            }
        }

        if (!account) {
            console.error(`❌ [${type}] : No Account Found! (Default Code: ${DEFAULTS[type] || 'None'})`);
            continue;
        }

        const expectedType = EXPECTED_TYPES[type];
        const isCorrect = account.type === expectedType;
        const statusIcon = isCorrect ? '✅' : '⚠️';

        console.log(`${statusIcon} [${type}]`);
        console.log(`   Method: ${method}`);
        console.log(`   Account: ${account.code} - ${account.name}`);
        console.log(`   Type: ${account.type} (Expected: ${expectedType})`);

        if (!isCorrect) {
            console.log(`   ACTION REQUIRED: Account Type mismatch! This may cause negative balances.`);
        }
        console.log('---');
    }
}

main();
