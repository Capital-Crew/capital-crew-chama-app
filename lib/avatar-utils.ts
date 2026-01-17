/**
 * Avatar utility functions for profile management
 */

export interface AvatarPreset {
    id: string;
    name: string;
    path: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
    { id: 'avatar-1', name: 'Robot', path: '/avatars/avatar-1.png' },
    { id: 'avatar-2', name: 'Cat', path: '/avatars/avatar-2.png' },
    { id: 'avatar-3', name: 'Owl', path: '/avatars/avatar-3.png' },
    { id: 'avatar-4', name: 'Dog', path: '/avatars/avatar-4.png' },
    { id: 'avatar-5', name: 'Astronaut', path: '/avatars/avatar-5.png' },
    { id: 'avatar-6', name: 'Ninja', path: '/avatars/avatar-6.png' },
];

/**
 * Extract initials from a full name
 * Examples:
 * - "John Doe" -> "JD"
 * - "Alice" -> "A"
 * - "Mary Jane Watson" -> "MW"
 */
export function getInitials(name: string | null | undefined): string {
    if (!name || name.trim() === '') return 'U';

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    // Get first letter of first name and first letter of last name
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();

    return firstInitial + lastInitial;
}

/**
 * Get the appropriate avatar URL based on user settings
 * Priority: custom image > avatar preset > null (will show initials)
 */
export function getAvatarUrl(user: {
    image?: string | null;
    avatarPreset?: string | null;
}): string | null {
    // Priority 1: Custom uploaded image
    if (user.image) {
        return user.image;
    }

    // Priority 2: Selected avatar preset
    if (user.avatarPreset) {
        const preset = AVATAR_PRESETS.find(p => p.id === user.avatarPreset);
        return preset?.path || null;
    }

    // Priority 3: null (will display initials)
    return null;
}

/**
 * Get avatar preset by ID
 */
export function getAvatarPreset(id: string): AvatarPreset | undefined {
    return AVATAR_PRESETS.find(p => p.id === id);
}
