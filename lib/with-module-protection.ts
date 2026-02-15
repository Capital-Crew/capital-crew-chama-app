
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac-service";
import { redirect } from "next/navigation";

/**
 * Higher-order function to protect Server Actions with RBAC module checks.
 * 
 * Usage:
 * export const createLoan = withModuleProtection('LOANS', async (data) => { ... })
 */
export function withModuleProtection<TArgs extends any[], TResult>(
    moduleKey: string,
    action: (...args: TArgs) => Promise<TResult>
) {
    return async (...args: TArgs): Promise<TResult | { error: string }> => {
        const session = await auth();

        if (!session?.user) {
            return { error: "Unauthorized: Please log in." };
        }

        const hasAccess = await checkPermission(session.user.role, moduleKey);

        if (!hasAccess) {
            console.warn(`[RBAC] Access Denied: User ${session.user.email} (Role: ${session.user.role}) attempted to access module ${moduleKey}`);
            return { error: "Access Denied: You do not have permission to access this module." };
        }

        return action(...args);
    };
}

/**
 * Server Component Guard - Usage in Page.tsx
 * if (!await protectPage('LOANS')) return redirect('/dashboard')
 */
export async function protectPage(moduleKey: string) {
    const session = await auth();
    if (!session?.user) return false;

    return await checkPermission(session.user.role, moduleKey);
}
