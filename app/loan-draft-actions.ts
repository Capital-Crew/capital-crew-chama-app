'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

interface SaveLoanDraftParams {
    formData: any
    loanType?: string
    step?: number
}

/**
 * Save loan application draft with step tracking
 * Upserts draft data for the current user
 */
export async function saveLoanDraft({ formData, loanType, step = 1 }: SaveLoanDraftParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { error: 'Unauthorized' }
        }

        const userId = session.user.id

        // Validate that we have some data to save
        if (!formData || typeof formData !== 'object') {
            return { error: 'Invalid form data' }
        }

        // Upsert the draft
        const draft = await db.loanDraft.upsert({
            where: { userId },
            create: {
                userId,
                data: formData,
                loanType,
                step
            },
            update: {
                data: formData,
                loanType,
                step,
                updatedAt: new Date()
            }
        })

        return { success: true, savedAt: new Date().toISOString(), draftId: draft.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to save draft' }
    }
}

/**
 * Get loan application draft for current user
 */
export async function getLoanDraft() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return null
        }

        const draft = await db.loanDraft.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                data: true,
                loanType: true,
                step: true,
                updatedAt: true,
                createdAt: true
            }
        })

        return draft
    } catch (error: any) {
        return null
    }
}

/**
 * Delete loan application draft for current user
 * Allows users to discard their draft and start a new application
 */
export async function deleteLoanDraft() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { error: 'Unauthorized' }
        }

        const userId = session.user.id

        // Check if draft exists
        const draft = await db.loanDraft.findUnique({
            where: { userId }
        })

        if (!draft) {
            return { error: 'No draft found' }
        }

        // Delete the draft (user can only delete their own draft)
        await db.loanDraft.delete({
            where: { userId }
        })

        revalidatePath('/loans')
        revalidatePath('/loans/apply')
        revalidatePath('/loans/draft')

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete draft' }
    }
}
