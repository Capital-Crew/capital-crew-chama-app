import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { MemberWriteService } from '@/services/member/MemberWriteService'
import { MemberReadService } from '@/services/member/MemberReadService'
import { AuditLogAction } from '@prisma/client'
import { withAudit } from '@/lib/with-audit'
import { db as prisma } from '@/lib/db'

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
    nationalId: z.string().min(5, "National ID is required"),
    branchId: z.string().optional()
})

/**
 * Create Member Action
 */
export const createMemberAction = withAudit(
    { actionType: AuditLogAction.MEMBER_ADDED, domain: 'MEMBERSHIP', apiRoute: '/api/membership/create' },
    async (ctx, formData: FormData): Promise<ActionResult> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        ctx.beginStep('Validate Member Data');
        const rawData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            mobile: formData.get('mobile'),
            email: formData.get('email'),
            nationalId: formData.get('nationalId'),
            branchId: formData.get('branchId') || undefined
        }

        const validated = createMemberSchema.safeParse(rawData)
        if (!validated.success) {
            ctx.setErrorCode('VALIDATION_ERROR');
            return { success: false, error: validated.error.issues[0].message }
        }
        ctx.endStep('Validate Member Data');

        try {
            ctx.beginStep('Execute Member Creation Service');
            const data = validated.data
            const member = await MemberWriteService.createMember({
                firstName: data.firstName,
                lastName: data.lastName,
                mobile: data.mobile,
                email: data.email || undefined,
                nationalId: data.nationalId,
                branchId: data.branchId,
                createdBy: session.user.id
            }, session.user.id)
            ctx.captureAfter(member);
            ctx.endStep('Execute Member Creation Service');

            revalidatePath('/dashboard/members')
            return { success: true, data: member }
        } catch (error: any) {
            ctx.setErrorCode('CREATION_FAILED');
            return { success: false, error: error.message || "Failed to create member" }
        }
    }
);

/**
 * Approve Member Action
 */
export const approveMemberAction = withAudit(
    { actionType: AuditLogAction.MEMBER_STATUS_CHANGED, domain: 'MEMBERSHIP', apiRoute: '/api/membership/approve' },
    async (ctx, memberId: string): Promise<ActionResult> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        ctx.beginStep('Capture Initial State');
        const existingMember = await prisma.member.findUnique({ where: { id: memberId } });
        if (existingMember) ctx.captureBefore('Member', memberId, existingMember);

        try {
            ctx.beginStep('Execute Member Approval Service');
            const member = await MemberWriteService.approveMember(memberId, session.user.id)
            ctx.captureAfter(member);
            ctx.endStep('Execute Member Approval Service');

            revalidatePath(`/dashboard/members`)
            revalidatePath(`/dashboard/members/${memberId}`)
            return { success: true, data: member }
        } catch (e: any) {
            ctx.setErrorCode('APPROVAL_FAILED');
            return { success: false, error: e.message }
        }
    }
);

/**
 * Activate Member Action
 */
export const activateMemberAction = withAudit(
    { actionType: AuditLogAction.MEMBER_STATUS_CHANGED, domain: 'MEMBERSHIP', apiRoute: '/api/membership/activate' },
    async (ctx, memberId: string): Promise<ActionResult> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        ctx.beginStep('Capture Initial State');
        const existingMember = await prisma.member.findUnique({ where: { id: memberId } });
        if (existingMember) ctx.captureBefore('Member', memberId, existingMember);

        try {
            ctx.beginStep('Execute Member Activation Service');
            const member = await MemberWriteService.activateMember(memberId, session.user.id)
            ctx.captureAfter(member);
            ctx.endStep('Execute Member Activation Service');

            revalidatePath(`/dashboard/members`)
            revalidatePath(`/dashboard/members/${memberId}`)
            return { success: true, data: member }
        } catch (e: any) {
            ctx.setErrorCode('ACTIVATION_FAILED');
            return { success: false, error: e.message }
        }
    }
);

/**
 * Deactivate (Close) Member Action
 */
export const deactivateMemberAction = withAudit(
    { actionType: AuditLogAction.MEMBER_STATUS_CHANGED, domain: 'MEMBERSHIP', apiRoute: '/api/membership/deactivate' },
    async (ctx, memberId: string): Promise<ActionResult> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        ctx.beginStep('Capture Initial State');
        const existingMember = await prisma.member.findUnique({ where: { id: memberId } });
        if (existingMember) ctx.captureBefore('Member', memberId, existingMember);

        try {
            ctx.beginStep('Execute Member Deactivation Service');
            const member = await MemberWriteService.deactivateMember(memberId, session.user.id)
            ctx.captureAfter(member);
            ctx.endStep('Execute Member Deactivation Service');

            revalidatePath(`/dashboard/members`)
            revalidatePath(`/dashboard/members/${memberId}`)
            return { success: true, data: member }
        } catch (e: any) {
            ctx.setErrorCode('DEACTIVATION_FAILED');
            return { success: false, error: e.message }
        }
    }
);
