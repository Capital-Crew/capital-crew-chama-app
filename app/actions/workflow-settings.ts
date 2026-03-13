'use server'

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { withAudit } from "@/lib/with-audit"
import { AuditLogAction } from "@prisma/client"

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

export const updateStageSettings = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'SECURITY', apiRoute: '/api/settings/workflow/stage' },
    async (ctx, stageId: string, minVotes: number) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user || session.user.role !== 'SYSTEM_ADMIN') {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error("Unauthorized")
        }

        ctx.beginStep('Capture Initial State');
        const stage = await prisma.workflowStage.findUnique({ where: { id: stageId } });
        if (stage) ctx.captureBefore('WorkflowStage', stageId, stage);

        try {
            ctx.beginStep('Update Database');
            const updatedStage = await prisma.workflowStage.update({
                where: { id: stageId },
                data: { minVotesRequired: minVotes }
            })
            ctx.captureAfter(updatedStage);
            ctx.endStep('Update Database');

            revalidatePath('/admin/workflows')
            return { success: true }
        } catch (error) {
            ctx.setErrorCode('UPDATE_FAILED');
            throw error;
        }
    }
);
