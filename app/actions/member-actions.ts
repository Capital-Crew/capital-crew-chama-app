'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { MemberWriteService } from '@/services/member/MemberWriteService'
import { MemberReadService } from '@/services/member/MemberReadService'

/**
 * Standardized Action Result
 */
export type ActionResult<T = any> = {
    success: boolean
    data?: T
    error?: string
}

// Zod Schemas
const createMemberSchema = z.object({
    firstName: z.string().min(2, "First Name is required"),
    lastName: z.string().min(2, "Last Name is required"),
    mobile: z.string().min(9, "Valid mobile number is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    nationalId: z.string().min(5, "National ID is required"), // Basic validation
    branchId: z.string().optional()
})

/**
 * Create Member Action
 * Handles validation, auth, and calls Write Service
 */
export async function createMemberAction(formData: FormData): Promise<ActionResult> {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
        return { success: false, error: "Unauthorized" }
    }

    // Extract Data
    const rawData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        mobile: formData.get('mobile'),
        email: formData.get('email'),
        nationalId: formData.get('nationalId'),
        branchId: formData.get('branchId') || undefined
    }

    // Validate
    const validated = createMemberSchema.safeParse(rawData)

    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    try {
        const data = validated.data

        // Call Service
        const member = await MemberWriteService.createMember({
            firstName: data.firstName,
            lastName: data.lastName,
            mobile: data.mobile,
            email: data.email || undefined,
            nationalId: data.nationalId,
            branchId: data.branchId,
            createdBy: session.user.id
        }, session.user.id)

        revalidatePath('/dashboard/members')
        return { success: true, data: member }

    } catch (error: any) {
        console.error("Create Member Error:", error)
        return { success: false, error: error.message || "Failed to create member" }
    }
}

/**
 * Approve Member Action
 */
export async function approveMemberAction(memberId: string): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const member = await MemberWriteService.approveMember(memberId, session.user.id)
        revalidatePath(`/dashboard/members`)
        revalidatePath(`/dashboard/members/${memberId}`)
        return { success: true, data: member }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

/**
 * Activate Member Action
 */
export async function activateMemberAction(memberId: string): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const member = await MemberWriteService.activateMember(memberId, session.user.id)
        revalidatePath(`/dashboard/members`)
        revalidatePath(`/dashboard/members/${memberId}`)
        return { success: true, data: member }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
