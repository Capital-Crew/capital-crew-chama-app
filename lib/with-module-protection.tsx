
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac-service";
import { redirect } from "next/navigation";
import { logger } from "./logger";

/**
 * Higher-order function to protect Server Components with RBAC module checks.
 */
export function withModuleProtection(
    WrappedComponent: any,
    moduleKey: string,
) {
    return async function ProtectedRoute(props: any) {
        const session = await auth();

        if (!session?.user) {
            return redirect('/login');
        }

        const hasAccess = await checkPermission((session.user as any).role, moduleKey);

        if (!hasAccess) {
            logger.warn(`[RBAC] Access Denied: User ${session.user.id} attempted to access module ${moduleKey}`);
            return redirect('/dashboard');
        }

        return <WrappedComponent {...props} />;
    };
}

/**
 * Server Component Guard - Usage in Page.tsx
 * if (!await protectPage('LOANS')) return redirect('/dashboard')
 */
export async function protectPage(moduleKey: string) {
    const session = await auth();
    if (!session?.user?.id) return false;

    // Fetch the live role from the DB to prevent stale JWT bypasses
    const { db } = await import('@/lib/db');
    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!dbUser?.role) return false;

    return await checkPermission(dbUser.role, moduleKey);
}
