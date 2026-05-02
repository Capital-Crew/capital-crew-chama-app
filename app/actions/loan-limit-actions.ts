'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

/**
 * Fetch all loan products with their concurrent limit configuration.
 */
export async function getLoanProductLimits() {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const products = await db.loanProduct.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            shortCode: true,
            isActive: true,
            maxConcurrentLoans: true,
            concurrentLimitActive: true,
            _count: {
                select: {
                    loans: {
                        where: {
                            status: { in: ['ACTIVE', 'APPROVED'] }
                        }
                    }
                }
            }
        }
    })

    return products.map(p => ({
        id: p.id,
        name: p.name,
        shortCode: p.shortCode,
        isActive: p.isActive,
        maxConcurrentLoans: p.maxConcurrentLoans,
        concurrentLimitActive: p.concurrentLimitActive,
        activeLoansCount: p._count.loans,
    }))
}

/**
 * Update a loan product's concurrent limit configuration.
 */
export async function updateLoanProductLimit(
    productId: string,
    maxConcurrentLoans: number,
    concurrentLimitActive: boolean
) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || !['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(user.role)) {
        throw new Error('Forbidden: Only administrators can manage loan limits.')
    }

    if (maxConcurrentLoans < 0 || !Number.isInteger(maxConcurrentLoans)) {
        throw new Error('Max concurrent loans must be a non-negative integer.')
    }

    const updated = await db.loanProduct.update({
        where: { id: productId },
        data: {
            maxConcurrentLoans,
            concurrentLimitActive,
        }
    })

    revalidatePath('/admin/loan-limits')
    revalidatePath('/admin/system')

    return {
        success: true,
        maxConcurrentLoans: updated.maxConcurrentLoans,
        concurrentLimitActive: updated.concurrentLimitActive,
    }
}

/**
 * Quick toggle: Enable or disable concurrent limit enforcement for a product.
 */
export async function toggleLoanProductLimitStatus(productId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || !['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(user.role)) {
        throw new Error('Forbidden: Only administrators can manage loan limits.')
    }

    const product = await db.loanProduct.findUnique({
        where: { id: productId },
        select: { concurrentLimitActive: true }
    })

    if (!product) throw new Error('Product not found.')

    const updated = await db.loanProduct.update({
        where: { id: productId },
        data: { concurrentLimitActive: !product.concurrentLimitActive }
    })

    revalidatePath('/admin/loan-limits')
    revalidatePath('/admin/system')

    return {
        success: true,
        concurrentLimitActive: updated.concurrentLimitActive,
    }
}
