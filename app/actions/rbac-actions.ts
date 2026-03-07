'use server'

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { togglePermission as togglePermissionService } from "@/lib/rbac-service";
import { withModuleProtection } from "@/lib/with-module-protection";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Fetch the complete Permissions Matrix Data
 */
export async function getPermissionsMatrix() {
    const session = await auth();
    if (!session?.user || !['SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    // 1. Get all Modules
    const modules = await db.systemModule.findMany({
        orderBy: { key: 'asc' } // Ensure consistent order (e.g. ACCOUNTS first, WALLET last) or maybe custom order
    });

    // 2. Get all Permissions
    const permissions = await db.rolePermission.findMany({});

    return { modules, permissions };
}



/**
 * Toggle a specific permission - Protected by ADMIN module access
 */
export const togglePermission = withModuleProtection('ADMIN', async (role: UserRole, moduleKey: string, canAccess: boolean) => {
    try {
        await togglePermissionService(role, moduleKey, canAccess);
        revalidatePath('/admin/access-control');
        revalidatePath('/dashboard'); // revalidate sidebar
        return { success: true };
    } catch (error) {
        return { error: "Failed to update permission" };
    }
});
