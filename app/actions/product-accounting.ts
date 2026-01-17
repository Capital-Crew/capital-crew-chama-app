'use server'

import { db } from '@/lib/db'
import { ProductAccountingType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getProductMappings(productId: string) {
    try {
        const mappings = await db.productAccountingMapping.findMany({
            where: { productId },
            include: { account: true }
        })

        return mappings
    } catch (error) {
        console.error('Error fetching product mappings:', error)
        return []
    }
}

export async function updateProductMapping(
    productId: string,
    type: ProductAccountingType,
    accountId: string
) {
    try {
        await db.productAccountingMapping.upsert({
            where: {
                productId_accountType: {
                    productId,
                    accountType: type
                }
            },
            create: {
                productId,
                accountType: type,
                accountId
            },
            update: {
                accountId
            }
        })

        revalidatePath(`/admin/products/${productId}`)
        return { success: true, message: 'Mapping updated successfully' }
    } catch (error) {
        console.error('Error updating product mapping:', error)
        return { success: false, message: 'Failed to update mapping' }
    }
}

export async function initializeProductMappings(productId: string) {
    // Optional: Pre-fill with reasonable defaults if possible, 
    // or just leave empty for manual assignment. 
    // For now, we'll leave it empty.
    return { success: true, message: 'Initialization not required' }
}
