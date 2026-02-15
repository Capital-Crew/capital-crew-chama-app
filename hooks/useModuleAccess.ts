'use client'

import { useRBAC } from "@/components/providers/RBACProvider"; // Assuming path
import { UserRole } from "@prisma/client";

export function useModuleAccess() {
    const { permissions, isLoading } = useRBAC();

    const canAccess = (moduleKey: string) => {
        // SYSTEM_ADMIN implies master access, but strictly we should rely on the map passed down
        // The map passed down ALREADY accounts for SYSTEM_ADMIN overrides in the backend service
        return permissions[moduleKey] ?? false;
    };

    return { canAccess, isLoading };
}
