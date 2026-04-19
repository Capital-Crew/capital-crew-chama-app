import { PrismaClient, EntityType } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- TRIGGERING SYSTEM WIDE WORKFLOW SYNC ---")
    
    // 1. Get current settings
    const settings = await prisma.saccoSettings.findFirst()
    if (!settings) {
        console.log("No settings found. Creating default...");
        return;
    }

    console.log(`Current Settings:`)
    console.log(`  Loans: ${settings.requiredApprovals}`)
    console.log(`  Welfare: ${settings.requiredWelfareApprovals}`)

    // 2. Perform Sync Logic (Inlined from actions)
    console.log("[SYNC] Updating LOAN stages...");
    const loanUpdates = await prisma.workflowStage.updateMany({
        where: {
            workflow: { entityType: EntityType.LOAN },
            isFinal: true
        },
        data: { minVotesRequired: settings.requiredApprovals }
    })
    console.log(`  Updated ${loanUpdates.count} loan stages.`);

    console.log("[SYNC] Updating WELFARE stages...");
    const welfareUpdates = await prisma.workflowStage.updateMany({
        where: {
            workflow: { entityType: EntityType.WELFARE }
        },
        data: { minVotesRequired: settings.requiredWelfareApprovals }
    })
    console.log(`  Updated ${welfareUpdates.count} welfare stages.`);

    console.log("\n--- SYNC COMPLETE ---")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
