
import { db as prisma } from "@/lib/db";
import { SystemAccountType } from "@prisma/client";

async function updateMapping() {
    console.log("Updating EVENT_CASH_WITHDRAWAL mapping...");

    // 1. Find 'CONTRIBUTIONS' account (Expected Code 3000)
    const contribAccount = await prisma.ledgerAccount.findFirst({
        where: { name: 'CONTRIBUTIONS' } // Using name to be safe, or code 3000
    });

    if (!contribAccount) {
        console.error("❌ Could not find 'CONTRIBUTIONS' account.");
        return;
    }

    console.log(`Found Contributions Account: [${contribAccount.code}] ${contribAccount.name} (${contribAccount.type})`);

    // 2. Update Mapping
    const mapping = await prisma.systemAccountingMapping.upsert({
        where: { type: 'EVENT_CASH_WITHDRAWAL' as SystemAccountType },
        update: {
            accountId: contribAccount.id
        },
        create: {
            type: 'EVENT_CASH_WITHDRAWAL' as SystemAccountType,
            accountId: contribAccount.id
        }
    });

    console.log(`✅ Updated EVENT_CASH_WITHDRAWAL to point to Account ID: ${contribAccount.id}`);
}

updateMapping()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
