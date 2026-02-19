
'use server'

import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
// import { generateRandomString } from '@/lib/utils'

// Validation Schema
const registrationSchema = z.object({
    firstName: z.string().min(2, "First Name is required"),
    lastName: z.string().min(2, "Last Name is required"),
    mobile: z.string().min(9, "Valid mobile number is required"),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    nationalId: z.string().min(5, "National ID is required"),
    branchId: z.string().optional()
})

export type RegistrationResult = {
    success: boolean
    data?: any
    error?: string,
    memberNumber?: number,
    walletId?: string
}

/**
 * Atomic Member Registration
 * 1. Calculates next Member Number
 * 2. Generates unique Wallet ID
 * 3. Creates Member and Wallet in single transaction
 */
export async function createMemberWithWallet(formData: FormData): Promise<RegistrationResult> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    // Restrict to Admins
    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes((session.user as any).role)) {
        return { success: false, error: "Unauthorized: Only Admins can register members" }
    }


    const rawData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        mobile: formData.get('mobile'),
        email: formData.get('email'),
        nationalId: formData.get('nationalId'),
        branchId: formData.get('branchId') || undefined
    }

    const validated = registrationSchema.safeParse(rawData)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    const { firstName, lastName, mobile, email, nationalId, branchId } = validated.data

    try {
        // 1. Get Liability Account (2000)
        const liabilityAccount = await prisma.ledgerAccount.findUnique({
            where: { code: '2000' } // Strict 5-Ledger Rule
        })

        if (!liabilityAccount) {
            throw new Error("System Configuration Error: Liability Account (2000) not found.")
        }

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 2. Generate Next Member Number (Locking would be ideal, but for now simple Max+1)
            const stats = await tx.member.aggregate({
                _max: { memberNumber: true }
            })
            const nextMemberNumber = (stats._max.memberNumber || 0) + 1

            // 3. Generate Unique Wallet ID (5 digits)
            // Retry logic could be added, but collision chance on 5 digits is distinct. 
            // Better to use a "WAL-" prefix + 6 random digits to be safe like existing pattern?
            // User requested "unique 5-digit string or UUID". Let's do 5-digit string.
            // Loop a few times to ensure uniqueness?
            let uniqueWalletId = ''
            let isUnique = false
            let attempts = 0

            while (!isUnique && attempts < 5) {
                const randomPart = Math.floor(10000 + Math.random() * 90000).toString() // 10000-99999
                uniqueWalletId = `WAL-${randomPart}` // Prefix for clarity

                const existing = await tx.wallet.findUnique({
                    where: { accountRef: uniqueWalletId }
                })
                if (!existing) isUnique = true
                attempts++
            }

            if (!isUnique) throw new Error("Failed to generate unique Wallet ID. Please try again.")

            // 4. Create Member
            const member = await tx.member.create({
                data: {
                    memberNumber: nextMemberNumber,
                    name: `${firstName} ${lastName}`,
                    contact: mobile,
                    status: 'PENDING',
                    createdBy: session.user.id,
                    branchId: branchId,
                    // 1:1 Relations
                    details: {
                        create: {
                            firstName,
                            lastName,
                            // mobile removed - not in MemberDetail schema
                        }
                    },
                    contactInfo: {
                        create: {
                            mobile,
                            email: email || undefined
                        }
                    },
                    identifiers: {
                        create: {
                            type: 'NATIONAL_ID',
                            value: nationalId
                        }
                    }
                }
            })

            // 5. Create Wallet
            const wallet = await tx.wallet.create({
                data: {
                    memberId: member.id,
                    accountRef: uniqueWalletId, // usage as ID
                    glAccountId: liabilityAccount.id,
                    status: 'ACTIVE',
                    currency: 'KES'
                }
            })

            // 6. Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'MEMBER_ADDED',
                    details: `Created Member #${nextMemberNumber} (${member.name}) with Wallet ${uniqueWalletId}`
                }
            })

            return { member, wallet }
        })

        revalidatePath('/dashboard/members')
        return {
            success: true,
            data: result.member,
            memberNumber: result.member.memberNumber,
            walletId: result.wallet.accountRef
        }

    } catch (error: any) {
        console.error("Atomic Registration Error:", error)
        return { success: false, error: error.message || "Registration failed." }
    }
}
