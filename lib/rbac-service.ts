
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { unstable_cache } from "next/cache";

export interface Permission {
    moduleKey: string;
    canAccess: boolean;
}

/**
 * Fetch all permissions for a given role.
 * Cached for performance.
 */
export const getPermissionsForRole = unstable_cache(
    async (role: UserRole) => {
        // 1. Get all system modules
        const modules = await db.systemModule.findMany({
            orderBy: { name: 'asc' }
        });

        // 2. Get existing permissions for role
        const permissions = await db.rolePermission.findMany({
            where: { role }
        });

        // 3. Merge: Default to FALSE if not found (deny by default)
        // EXCEPT for SYSTEM_ADMIN who gets explicit TRUE overrides usually, 
        // but we'll stick to DB state + safety fallback

        return modules.map(mod => {
            const perm = permissions.find(p => p.moduleKey === mod.key);

            // Safety: SYSTEM_ADMIN always has access to ADMIN and REPORTS_HUB
            if (role === 'SYSTEM_ADMIN' && (mod.key === 'ADMIN' || mod.key === 'REPORTS_HUB')) {
                return { ...mod, canAccess: true };
            }

            return {
                ...mod,
                canAccess: perm?.canAccess ?? false // Default deny
            };
        });
    },
    ['rbac-permissions'],
    { tags: ['rbac'] }
);

/**
 * Check if a role has access to a specific module
 */
export async function checkPermission(role: UserRole, moduleKey: string): Promise<boolean> {
    // Safety: SYSTEM_ADMIN always has access to ADMIN and REPORTS_HUB
    if (role === 'SYSTEM_ADMIN' && (moduleKey === 'ADMIN' || moduleKey === 'REPORTS_HUB')) {
        return true;
    }

    // For other roles (and other modules for SYSTEM_ADMIN), strict check
    const permission = await db.rolePermission.findUnique({
        where: {
            role_moduleKey: {
                role,
                moduleKey
            }
        }
    });

    return permission?.canAccess ?? false;
}

/**
 * Toggle permission (Admin Action)
 */
export async function togglePermission(role: UserRole, moduleKey: string, canAccess: boolean) {
    // Safety: Cannot disable ADMIN access for SYSTEM_ADMIN
    if (role === 'SYSTEM_ADMIN' && moduleKey === 'ADMIN' && !canAccess) {
        throw new Error("Cannot remove Admin access from System Admin");
    }

    /* 
     * Using upsert allows us to handle "permissions that describe defaults" 
     * or handle scenarios where the row doesn't exist yet (default deny).
     */
    await db.rolePermission.upsert({
        where: {
            role_moduleKey: {
                role,
                moduleKey
            }
        },
        create: {
            role,
            moduleKey,
            canAccess
        },
        update: {
            canAccess
        }
    });
}
