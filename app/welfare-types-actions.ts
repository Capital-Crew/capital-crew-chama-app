'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

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

export async function createWelfareType(data: WelfareTypeFormData) {
    try {
        const welfareType = await prisma.welfareType.create({
            data: {
                name: data.name,
                description: data.description,
                glAccountId: data.glAccountId,
                isActive: data.isActive ?? true
            }
        })

        // Audit Log
        const session = await auth()
        if (session?.user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'WELFARE_TYPE_CREATED' as any,
                    details: `Created welfare type: ${data.name}`
                }
            })
        }

        revalidatePath('/welfare')
        revalidatePath('/admin/system')
        return { success: true, data: welfareType }
    } catch (error: any) {
        console.error('Error creating welfare type:', error)
        return { success: false, error: error.message }
    }
}

export async function updateWelfareType(id: string, data: Partial<WelfareTypeFormData>) {
    try {
        const welfareType = await prisma.welfareType.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                glAccountId: data.glAccountId,
                isActive: data.isActive
            }
        })

        // Audit Log
        const session = await auth()
        if (session?.user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'WELFARE_TYPE_UPDATED' as any,
                    details: `Updated welfare type: ${id}`
                }
            })
        }

        revalidatePath('/welfare')
        revalidatePath('/admin/system')
        return { success: true, data: welfareType }
    } catch (error: any) {
        console.error('Error updating welfare type:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteWelfareType(id: string) {
    try {
        // Soft delete would be better if there are relations, but schema has cascade on custom fields
        // Check for requisitions first
        const requisitionCount = await prisma.welfareRequisition.count({
            where: { welfareTypeId: id }
        })

        if (requisitionCount > 0) {
            // Soft delete by deactivating
            await prisma.welfareType.update({
                where: { id },
                data: { isActive: false }
            })
            return { success: true, message: 'Welfare type deactivated (has existing requisitions)' }
        }

        await prisma.welfareType.delete({
            where: { id }
        })

        // Audit Log
        const session = await auth()
        if (session?.user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'WELFARE_TYPE_DELETED' as any,
                    details: `Deleted welfare type: ${id}`
                }
            })
        }

        revalidatePath('/welfare')
        revalidatePath('/admin/system')
        return { success: true, message: 'Welfare type deleted' }
    } catch (error: any) {
        console.error('Error deleting welfare type:', error)
        return { success: false, error: error.message }
    }
}

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
        console.error('Error fetching welfare types:', error)
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
        console.error('Error fetching welfare type:', error)
        return { success: false, error: error.message }
    }
}

// ==========================================
// Custom Fields Management
// ==========================================

export async function addCustomField(data: CustomFieldFormData) {
    try {
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

        revalidatePath(`/welfare`)
        return { success: true, data: field }
    } catch (error: any) {
        console.error('Error adding custom field:', error)
        return { success: false, error: error.message }
    }
}

export async function updateCustomField(id: string, data: Partial<CustomFieldFormData>) {
    try {
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

        revalidatePath(`/welfare`)
        return { success: true, data: field }
    } catch (error: any) {
        console.error('Error updating custom field:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteCustomField(id: string) {
    try {
        await prisma.welfareCustomField.delete({
            where: { id }
        })

        revalidatePath(`/welfare`)
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting custom field:', error)
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
        console.error('Error reordering fields:', error)
        return { success: false, error: error.message }
    }
}
