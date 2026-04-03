'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { MemberWriteService } from '@/services/member/MemberWriteService'
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

/**
 * Update Member Profile Action
 */
const updateProfileSchema = z.object({
    memberId: z.string(),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(9, "Valid mobile number is required")
})

export const updateMemberProfile = withAudit(
    { actionType: AuditLogAction.MEMBER_UPDATED, domain: 'MEMBERSHIP', apiRoute: '/api/membership/update-profile' },
    async (ctx, data: { memberId: string, email: string, mobile: string }): Promise<ActionResult> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        const validated = updateProfileSchema.safeParse(data)
        if (!validated.success) {
            ctx.setErrorCode('VALIDATION_ERROR');
            return { success: false, error: validated.error.issues[0].message }
        }

        const { memberId, email, mobile } = validated.data;

        try {
            ctx.beginStep('Update Member & User Data');
            
            // Start a transaction to ensure both are updated
            const result = await prisma.$transaction(async (tx) => {
                // 1. Update MemberContact
                const contact = await tx.memberContact.upsert({
                    where: { memberId },
                    update: { email, mobile },
                    create: { memberId, email, mobile }
                });

                // 2. Find linked User and update email
                const member = await tx.member.findUnique({
                    where: { id: memberId },
                    select: { user: true }
                });

                if (member?.user) {
                    await tx.user.update({
                        where: { id: member.user.id },
                        data: { email }
                    });
                }

                return contact;
            });

            ctx.captureAfter(result);
            ctx.endStep('Update Member & User Data');

            revalidatePath(`/dashboard/members/${memberId}`)
            revalidatePath(`/members/${memberId}`)
            
            return { success: true, data: result }
        } catch (e: any) {
            ctx.setErrorCode('UPDATE_FAILED');
            return { success: false, error: e.message || "Failed to update profile" }
        }
    }
);

export const updateMemberProfileImage = withAudit(
    { actionType: AuditLogAction.MEMBER_UPDATED, domain: 'MEMBERSHIP', apiRoute: '/api/members/profile-image' },
    async (ctx, formData: FormData) => {
        const memberId = formData.get("memberId") as string;
        const file = formData.get("file") as File;
        
        if (!memberId || !file) {
            return { success: false, error: "Missing member ID or file" };
        }

        // Limit size to 2MB (2 * 1024 * 1024)
        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: "Image size exceeds 2MB limit" };
        }

        try {
            ctx.beginStep('Find Member and User');
            const member = await prisma.member.findUnique({
                where: { id: memberId },
                include: { user: true }
            });

            if (!member?.user?.id) {
                ctx.setErrorCode('USER_NOT_FOUND');
                return { success: false, error: "Member has no associated user account" };
            }

            ctx.beginStep('Process Image');
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

            ctx.beginStep('Update Database');
            await prisma.user.update({
                where: { id: member.user.id },
                data: { image: base64Image }
            });

            revalidatePath(`/members/${memberId}`);
            revalidatePath(`/`, 'layout');
            return { success: true };
        } catch (error) {
            console.error("Upload error:", error);
            ctx.setErrorCode('UPLOAD_FAILED');
            return { success: false, error: "Failed to upload image" };
        }
    }
);
