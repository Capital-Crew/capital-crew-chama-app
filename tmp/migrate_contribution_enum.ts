import { db as prisma } from "@/lib/db";

async function migrateEnum() {
    console.log("Migrating SystemAccountingMapping from EVENT_SHARE_CONTRIBUTION to EVENT_CONTRIBUTION_PAYMENT...");
    
    // We update the type in the mapping table
    const result = await prisma.systemAccountingMapping.updateMany({
        where: {
            type: 'EVENT_SHARE_CONTRIBUTION' as any
        },
        data: {
            type: 'EVENT_CONTRIBUTION_PAYMENT' as any
        }
    });

    console.log(`Migrated ${result.count} mapping records.`);
}

migrateEnum()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
