export enum UserRole {
    SYSTEM_ADMIN = 'SYSTEM_ADMIN',
    CHAIRPERSON = 'CHAIRPERSON',
    TREASURER = 'TREASURER',
    SECRETARY = 'SECRETARY',
    MEMBER = 'MEMBER'
}

export function hasAdminAccess(role?: string): boolean {
    if (!role) return false;
    const allowedRoles = [
        'SYSTEM_ADMIN',
        'CHAIRPERSON',
        'SECRETARY',
        'TREASURER',
        'SYSTEM_ADMINISTRATOR' // Fallback for safety
    ];
    return allowedRoles.includes(role);
}
