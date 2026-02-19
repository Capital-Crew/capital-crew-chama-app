
import { db as prisma } from "@/lib/db";

async function checkMappings() {
    console.log("Checking System Accounting Mappings...");
    const mappings = await prisma.systemAccountingMapping.findMany({
        include: { account: true }
    });

    mappings.forEach((m: any) => {
        console.log(`- ${m.type} -> [${m.account.code}] ${m.account.name} (${m.account.type})`);
    });
}

checkMappings().catch(console.error);
