import { db as prisma } from "@/lib/db";

async function checkMappings() {
    console.log("Current SystemAccountingMappings:");
    const mappings = await prisma.systemAccountingMapping.findMany();
    for (const m of mappings) {
        console.log(`- ${m.type}: ${m.accountId}`);
    }
}

checkMappings()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
