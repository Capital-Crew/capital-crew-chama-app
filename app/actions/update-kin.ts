'use server'

import { z } from 'zod'
import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Define manually to avoid dependency on generated client if generation failed
const RELATIONSHIP_ENUM = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'] as const

// Regex patterns for validation
const COUNTRY_PATTERNS: Record<string, { regex: RegExp; label: string; example: string }> = {
    'KE': { regex: /^(?:\+254|0)[17](?:[0-9] ?){8}$/, label: 'Kenya (+254)', example: '+254712345678' },
    'US': { regex: /^\+1[2-9]\d{9}$/, label: 'USA (+1)', example: '+12125551234' },
    'UG': { regex: /^(?:\+256|0)[7]\d{8}$/, label: 'Uganda (+256)', example: '+256701234567' },
    'TZ': { regex: /^(?:\+255|0)[67]\d{8}$/, label: 'Tanzania (+255)', example: '+255712345678' },
    'UK': { regex: /^\+44\d{10}$/, label: 'UK (+44)', example: '+447911123456' }
}

const kinSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    relationship: z.enum(RELATIONSHIP_ENUM),
    // Validate that nationality is one of the keys in COUNTRY_PATTERNS
    nationality: z.string().refine((val) => Object.keys(COUNTRY_PATTERNS).includes(val), {
        message: "Invalid nationality code"
    }),
    phone: z.string().min(5, "Phone number must be at least 5 digits"),
    altPhone: z.string().optional().or(z.literal('')),
    allocation: z.coerce.number().min(0, "Allocation cannot be negative").max(100, "Allocation cannot exceed 100")
}).superRefine((data, ctx) => {
    const pattern = COUNTRY_PATTERNS[data.nationality]
    if (pattern) {
        if (!pattern.regex.test(data.phone.replace(/\s+/g, ''))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['phone'],
                message: `Invalid format for ${pattern.label}. Expected: ${pattern.example}`
            })
        }
    }
})

export async function updateBeneficiaries(memberId: string, beneficiaries: any[]) {
    try {
        // Validation: Check if Prisma Client is ready
        if (!(prisma as any).nextOfKin) {
            throw new Error("System update pending: Server restart required to apply schema changes.")
        }

        if (!beneficiaries || !Array.isArray(beneficiaries)) {
            return { error: "Invalid data: No beneficiaries provided." }
        }

        // 1. Validate Input
        const validatedBeneficiaries = await Promise.all(beneficiaries.map(async b => {
            return kinSchema.parseAsync(b)
        }))

        // 2. Validate Sum
        const totalAllocation = validatedBeneficiaries.reduce((sum, b) => sum + b.allocation, 0)

        // Allow small float error but strict on 100
        if (Math.abs(totalAllocation - 100) > 0.01) {
            return { error: `Total allocation must equal exactly 100%. Current total: ${totalAllocation.toFixed(2)}%` }
        }

        // 3. Transaction
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Delete existing for this member to avoid ghosts
            await (tx as any).nextOfKin.deleteMany({ where: { memberId } })

            // Insert new list
            if (validatedBeneficiaries.length > 0) {
                await (tx as any).nextOfKin.createMany({
                    data: validatedBeneficiaries.map(b => ({
                        memberId,
                        name: b.name,
                        relationship: b.relationship, // String matches enum
                        nationality: b.nationality,
                        phone: b.phone,
                        altPhone: b.altPhone || null,
                        allocation: b.allocation
                    }))
                })
            }
        })

        revalidatePath(`/members/${memberId}`)
        return { success: true }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map(err => {
                return err.path.length > 0 ? `${err.path.join('.')}: ${err.message}` : err.message
            }).join(', ')
            return { error: errorMessages || 'Validation failed' }
        }
        return { error: error.message || 'Failed to update beneficiaries' }
    }
}
