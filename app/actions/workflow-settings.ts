'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getWorkflowSettings() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SYSTEM_ADMIN') {
        throw new Error("Unauthorized")
    }

    const workflows = await prisma.workflowDefinition.findMany({
        include: {
            stages: {
                orderBy: { stepNumber: 'asc' }
            }
        },
        orderBy: { entityType: 'asc' }
    })

    return workflows
}

export async function updateStageSettings(stageId: string, minVotes: number) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SYSTEM_ADMIN') {
        throw new Error("Unauthorized")
    }

    await prisma.workflowStage.update({
        where: { id: stageId },
        data: { minVotesRequired: minVotes }
    })

    revalidatePath('/admin/workflows')
    return { success: true }
}
