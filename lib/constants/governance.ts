/**
 * Governance Constants
 * 
 * Centralized governance configuration to avoid "use server" export errors
 * and ensure consistency across UI and server logic.
 */

export const PRIVILEGED_ROLES = ['TREASURER', 'CHAIRPERSON', 'SECRETARY', 'SYSTEM_ADMIN'];

// Map entity types to the required permission identifiers in string format
export const ENTITY_PERMISSION_MAP: Record<string, string[]> = {
    'LOAN': ['APPROVE_LOANS', 'APPROVE_LOAN', 'canApprove'],
    'LOAN_NOTE': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
    'LOAN_NOTE_PAYMENT': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
    'LOAN_NOTE_SETTLEMENT': ['APPROVE_NOTE', 'APPROVE_LOAN_NOTES', 'canApproveLoanNotes'],
    'MEMBER': ['APPROVE_MEMBERS', 'canApproveMember'],
    'MEMBER_REGISTRATION': ['APPROVE_MEMBERS', 'canApproveMember'],
    'EXPENSE': ['APPROVE_EXPENSES', 'canApprove'],
};
