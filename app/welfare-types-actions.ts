'use server'

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { withAudit } from "@/lib/with-audit"
import { AuditLogAction } from "@prisma/client"

export type WelfareTypeFormData = {
    name: string
    description?: string
    glAccountId: string
    isActive?: boolean
}

export type CustomFieldFormData = {
    welfareTypeId: string
    fieldName: string
    fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'
    isRequired: boolean
    options?: string[] // simplified for transport, will store as Json
    displayOrder?: number
}

// ==========================================
// Welfare Types Management
// ==========================================

export const createWelfareType = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'WELFARE', apiRoute: '/api/welfare/types/create' },
    async (ctx, data: WelfareTypeFormData) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Create Welfare Type');
            const welfareType = await prisma.welfareType.create({
                data: {
                    name: data.name,
                    description: data.description,
                    glAccountId: data.glAccountId,
                    isActive: data.isActive ?? true
                }
            })
            ctx.captureAfter(welfareType);
            ctx.endStep('Create Welfare Type');

            revalidatePath('/welfare')
            revalidatePath('/admin/system')
            return { success: true, data: welfareType }
        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            return { success: false, error: error.message }
        }
    }
);

export const updateWelfareType = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'WELFARE', apiRoute: '/api/welfare/types/update' },
    async (ctx, id: string, data: Partial<WelfareTypeFormData>) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Fetch Current State');
            const before = await prisma.welfareType.findUnique({ where: { id } })
            if (before) ctx.captureBefore('WelfareType', id, before);
            ctx.endStep('Fetch Current State');

            ctx.beginStep('Update Welfare Type');
            const welfareType = await prisma.welfareType.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    glAccountId: data.glAccountId,
                    isActive: data.isActive
                }
            })
            ctx.captureAfter(welfareType);
            ctx.endStep('Update Welfare Type');

            revalidatePath('/welfare')
            revalidatePath('/admin/system')
            return { success: true, data: welfareType }
        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            return { success: false, error: error.message }
        }
    }
);

export const deleteWelfareType = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'WELFARE', apiRoute: '/api/welfare/types/delete' },
    async (ctx, id: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Check Dependencies');
            const before = await prisma.welfareType.findUnique({ where: { id } })
            if (before) ctx.captureBefore('WelfareType', id, before);

            const requisitionCount = await prisma.welfareRequisition.count({
                where: { welfareTypeId: id }
            })

            if (requisitionCount > 0) {
                const updated = await prisma.welfareType.update({
                    where: { id },
                    data: { isActive: false }
                })
                ctx.captureAfter(updated);
                ctx.endStep('Check Dependencies');
                return { success: true, message: 'Welfare type deactivated (has existing requisitions)' }
            }
            ctx.endStep('Check Dependencies');

            ctx.beginStep('Delete Welfare Type');
            await prisma.welfareType.delete({
                where: { id }
            })
            ctx.endStep('Delete Welfare Type');

            revalidatePath('/welfare')
            revalidatePath('/admin/system')
            return { success: true, message: 'Welfare type deleted' }
        } catch (error: any) {
            ctx.setErrorCode('DATABASE_ERROR');
            return { success: false, error: error.message }
        }
    }
);

export async function getWelfareTypes(includeInactive = false) {
    try {
        const where = includeInactive ? {} : { isActive: true }
        const types = await prisma.welfareType.findMany({
            where,
            include: {
                glAccount: {
                    select: { name: true, code: true }
                },
                customFields: {
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        })
        return { success: true, data: types }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getWelfareTypeById(id: string) {
    try {
        const type = await prisma.welfareType.findUnique({
            where: { id },
            include: {
                glAccount: true,
                customFields: {
                    orderBy: { displayOrder: 'asc' }
                }
            }
        })
        return { success: true, data: type }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ==========================================
// Custom Fields Management
// ==========================================

export const addCustomField = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'WELFARE', apiRoute: '/api/welfare/fields/add' },
    async (ctx, data: CustomFieldFormData) => {
        ctx.beginStep('Create Custom Field');
        const field = await prisma.welfareCustomField.create({
            data: {
                welfareTypeId: data.welfareTypeId,
                fieldName: data.fieldName,
                fieldType: data.fieldType,
                isRequired: data.isRequired,
                options: data.options ? JSON.stringify(data.options) : undefined,
                displayOrder: data.displayOrder ?? 0
            }
        })
        ctx.captureAfter(field);
        ctx.endStep('Create Custom Field');

        revalidatePath(`/welfare`)
        return { success: true, data: field }
    }
);

export const updateCustomField = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'WELFARE', apiRoute: '/api/welfare/fields/update' },
    async (ctx, id: string, data: Partial<CustomFieldFormData>) => {
        ctx.beginStep('Update Custom Field');
        const before = await prisma.welfareCustomField.findUnique({ where: { id } })
        if (before) ctx.captureBefore('CustomField', id, before);

        const field = await prisma.welfareCustomField.update({
            where: { id },
            data: {
                fieldName: data.fieldName,
                fieldType: data.fieldType,
                isRequired: data.isRequired,
                options: data.options ? JSON.stringify(data.options) : undefined,
                displayOrder: data.displayOrder
            }
        })
        ctx.captureAfter(field);
        ctx.endStep('Update Custom Field');

        revalidatePath(`/welfare`)
        return { success: true, data: field }
    }
);

export async function deleteCustomField(id: string) {
    try {
        await prisma.welfareCustomField.delete({
            where: { id }
        })

        revalidatePath(`/welfare`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function reorderCustomFields(welfareTypeId: string, orderedIds: string[]) {
    try {
        const updates = orderedIds.map((id, index) =>
            prisma.welfareCustomField.update({
                where: { id },
                data: { displayOrder: index }
            })
        )

        await prisma.$transaction(updates)
        revalidatePath(`/welfare`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
