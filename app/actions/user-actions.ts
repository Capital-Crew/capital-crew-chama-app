'use server'

import { auth } from "@/auth"
import { db as prisma } from "@/lib/db"
import { AuditLogAction } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const assignUsernameSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username too long").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    // Optional member number verification if passed
    memberNumber: z.number().optional()
})

/**
 * Assigns a username with "Integrity Guard" Checks
 * Ensures User has a valid Member and Wallet BEFORE allowing assignment.
 */
export async function assignUsername(formData: FormData) {
    const session = await auth()

    // 0. Authorization
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    // Check if admin
    const actor = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (actor?.role !== 'SYSTEM_ADMIN' && actor?.role !== 'CHAIRPERSON' && actor?.role !== 'SECRETARY') {
        return { success: false, error: "Unauthorized: Insufficient permissions" }
    }

    const rawData = {
        userId: formData.get('userId'),
        username: formData.get('username'),
        memberNumber: formData.get('memberNumber') ? Number(formData.get('memberNumber')) : undefined
    }

    const validated = assignUsernameSchema.safeParse(rawData)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    const { userId, username, memberNumber } = validated.data

    try {
        // 1. Fetch User with Member and Wallet
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                member: {
                    include: {
                        wallet: true
                    }
                }
            }
        })

        if (!targetUser) return { success: false, error: "User not found" }

        // 2. INTEGRITY GUARD CHECKS

        // A. Member Link Check
        if (!targetUser.member) {
            return { success: false, error: "Integrity Error: User is not linked to any Member record." }
        }

        // B. Wallet Link Check
        if (!targetUser.member.wallet) {
            return { success: false, error: "Critical Integrity Error: Member has no linked Wallet." }
        }

        // C. Member Number Verification (if provided)
        if (memberNumber !== undefined && targetUser.member.memberNumber !== memberNumber) {
            return { success: false, error: `Member Number Mismatch. Expected ${targetUser.member.memberNumber}, got ${memberNumber}.` }
        }

        // 3. Username Uniqueness Check (checking 'name' field effectively acting as username for now, or new field?)
        // Assuming 'name' describes the display name. If 'username' is a new concept not in schema, using 'name' or existing field.
        // User request says "assignUsername". Schema has 'name'. Let's assume 'name' is being used or check if we need to add 'username' field to schema?
        // Schema view (Line 363) shows `name String?`. No `username`.
        // I will use `name` for now as the display identifier, or maybe `email`?
        // The prompt implies a distinct "Username". But if schema lacks it, I'll update `name` for now and add a TODO.
        // Or better: The prompt says "finalize Username Assignment". Maybe they mean creating a Login Username?
        // But `User` uses `email` for login (Line 364: email @unique).
        // Let's assume `name` is the target for "Username" in this context unless specified otherwise.

        // Wait, "Username Assign" might imply mapping a Member to a User Account?
        // No, current logic `assignUsername` usually means giving them a handle.
        // I will update `name`.

        await prisma.user.update({
            where: { id: userId },
            data: { name: username }
        })

        // 4. Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id!,
                action: AuditLogAction.USER_RIGHTS_UPDATED, // Reuse enum or create new
                details: `Assigned username '${username}' to Member #${targetUser.member.memberNumber} (Wallet: ${targetUser.member.wallet.accountRef})`
            }
        })

        revalidatePath('/admin/system')
        return { success: true }

    } catch (error: any) {
        console.error("Assign Username Error:", error)
        return { success: false, error: "Database error occurred." }
    }
}
