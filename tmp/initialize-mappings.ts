
import { PrismaClient } from '@prisma/client'
import { DEFAULT_MAPPINGS } from '../lib/accounting/constants.js'

const prisma = new PrismaClient()

async function main() {
    console.log('🔗 Initializing System Accounting Mappings...');
    
    const ops = [];
    for (const [type, code] of Object.entries(DEFAULT_MAPPINGS)) {
        const account = await prisma.ledgerAccount.findUnique({ where: { code } });
        if (account) {
            ops.push(prisma.systemAccountingMapping.upsert({
                where: { type: type as any },
                update: { accountId: account.id },
                create: {
                    type: type as any,
                    accountId: account.id
                }
            }));
        } else {
            console.warn(`⚠️  Account not found for code ${code} (type: ${type})`);
        }
    }

    await prisma.$transaction(ops);
    console.log(`✅ Initialized ${ops.length} mapping records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
