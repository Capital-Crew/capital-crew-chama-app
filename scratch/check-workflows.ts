import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- WORKFLOW DEFINITIONS ---")
    const definitions = await prisma.workflowDefinition.findMany({
        include: {
            stages: {
                orderBy: { stepNumber: 'asc' }
            }
        }
    })

    definitions.forEach(d => {
        console.log(`\nEntity: ${d.entityType} (${d.name})`)
        d.stages.forEach(s => {
            console.log(`  Stage ${s.stepNumber}: ${s.name}`)
            console.log(`    Role: ${s.requiredRole}`)
            console.log(`    Min Votes: ${s.minVotesRequired}`)
            console.log(`    Final: ${s.isFinal}`)
        })
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
