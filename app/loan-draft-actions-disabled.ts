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
