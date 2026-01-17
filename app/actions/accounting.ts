'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ProductAccountingType } from '@prisma/client'
import { auth } from '@/auth'

// Validation Schema
const MappingSchema = z.object({
    INTEREST_INCOME: z.string().min(1, 'Required'),
    INTEREST_RECEIVABLE: z.string().min(1, 'Required'),
    PENALTY_INCOME: z.string().min(1, 'Required'),
    PENALTY_RECEIVABLE: z.string().min(1, 'Required'),
    LOAN_PORTFOLIO: z.string().min(1, 'Required'),
    FUND_SOURCE: z.string().min(1, 'Required'),
})

export async function updateProductMappings(productId: string, mappings: Record<string, string>) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error('Unauthorized')

        // 1. Validate Input
        const validated = MappingSchema.parse(mappings)

        // 2. Transactional Update
        await prisma.$transaction(async (tx) => {
            // A. Clear existing configurations
            await tx.productAccountingMapping.deleteMany({
                where: { productId }
            })

            // B. Create new configurations
            const entries = Object.entries(validated).map(([type, accountId]) => ({
                productId,
                accountType: type as ProductAccountingType,
                accountId
            }))

            await tx.productAccountingMapping.createMany({
                data: entries
            })
        })

        revalidatePath('/loan-management/products') // Or wherever this form lives
        return { success: true }
    } catch (error: any) {
        console.error('Update Mapping Failed:', error)
        return { success: false, error: error.message }
    }
}
