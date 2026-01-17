'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { AuditLogAction, UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function updateUserRights(targetUserId: string, newRole: UserRole) {
    const session = await auth()

    // 1. Strict Authorization Check
    const currentUser = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { id: true, name: true, role: true }
    })

    if (currentUser?.role !== 'SYSTEM_ADMIN' && currentUser?.role !== 'SYSTEM_ADMINISTRATOR') { // Handle both for safety
        return { success: false, error: "Unauthorized: Only System Administrators can manage user rights." }
    }

    // 2. Prevent Self-Demotion/Change
    if (targetUserId === currentUser.id) {
        return { success: false, error: "Operation Denied: You cannot modify your own access rights." }
    }

    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { name: true, role: true }
        })

        if (!targetUser) return { success: false, error: "User not found" }

        // 3. Update Role
        await prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole }
        })

        // 4. Audit Log
        await prisma.auditLog.create({
            data: {
                userId: currentUser.id,
                action: AuditLogAction.USER_RIGHTS_UPDATED,
                details: `Changed role for ${targetUser.name} from ${targetUser.role} to ${newRole}`
            }
        })

        revalidatePath('/admin/system')
        return { success: true }
    } catch (error) {
        console.error("Failed to update user rights:", error)
        return { success: false, error: "Database error occurred" }
    }
}
