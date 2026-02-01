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
        console.error('Error saving loan draft:', error)
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
        console.error('Error fetching loan draft:', error)
        return null
    }
}

/**
 * Delete loan application draft for current user
 * 
 * ⚠️ DISABLED: Drafts cannot be deleted once saved.
 * This protects user data and ensures loan applications are not accidentally lost.
 * 
 * Drafts are automatically cleaned up when:
 * - Application is successfully submitted
 * - Application is approved/rejected
 */
export async function deleteLoanDraft() {
    return {
        error: 'Draft deletion is disabled. Drafts are automatically removed when the application is submitted.'
    }
}
