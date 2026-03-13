'use server'

import { db as prisma } from '@/lib/db'
import { Prisma, AuditLogAction } from '@prisma/client'
import { auth } from '@/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { withAudit } from '@/lib/with-audit'

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
 */
export const createMemberWithWallet = withAudit(
    { actionType: AuditLogAction.MEMBER_ADDED, domain: 'MEMBERSHIP', apiRoute: '/api/membership/register' },
    async (ctx, formData: FormData): Promise<RegistrationResult> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized" }
        }

        if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes((session.user as any).role)) {
            ctx.setErrorCode('FORBIDDEN');
            return { success: false, error: "Unauthorized: Only Admins can register members" }
        }

        ctx.beginStep('Validate Input Data');
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
            ctx.setErrorCode('VALIDATION_ERROR');
            return { success: false, error: validated.error.issues[0].message }
        }
        const { firstName, lastName, mobile, email, nationalId, branchId } = validated.data
        ctx.endStep('Validate Input Data');

        try {
            ctx.beginStep('Resolve System Configuration');
            const liabilityAccount = await prisma.ledgerAccount.findUnique({
                where: { code: '2000' }
            })

            if (!liabilityAccount) {
                ctx.setErrorCode('SYSTEM_CONFIG_ERROR');
                throw new Error("System Configuration Error: Liability Account (2000) not found.")
            }
            ctx.endStep('Resolve System Configuration');

            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                ctx.beginStep('Generate Member Number');
                const stats = await tx.member.aggregate({
                    _max: { memberNumber: true }
                })
                const nextMemberNumber = (stats._max.memberNumber || 0) + 1
                ctx.endStep('Generate Member Number', { memberNumber: nextMemberNumber });

                ctx.beginStep('Generate Unique Wallet ID');
                let uniqueWalletId = ''
                let isUnique = false
                let attempts = 0

                while (!isUnique && attempts < 5) {
                    const { randomBytes } = await import('crypto')
                    uniqueWalletId = `WAL-${randomBytes(4).toString('hex').toUpperCase()}`

                    const existing = await tx.wallet.findUnique({
                        where: { accountRef: uniqueWalletId }
                    })
                    if (!existing) isUnique = true
                    attempts++
                }

                if (!isUnique) {
                    ctx.setErrorCode('WALLET_ID_COLLISION');
                    throw new Error("Failed to generate unique Wallet ID. Please try again.")
                }
                ctx.endStep('Generate Unique Wallet ID', { walletId: uniqueWalletId });

                ctx.beginStep('Create Member Record');
                const member = await tx.member.create({
                    data: {
                        memberNumber: nextMemberNumber,
                        name: `${firstName} ${lastName}`,
                        contact: mobile,
                        status: 'PENDING',
                        createdBy: session.user.id,
                        branchId: branchId,
                        details: {
                            create: { firstName, lastName }
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
                ctx.endStep('Create Member Record');

                ctx.beginStep('Create Wallet Record');
                const wallet = await tx.wallet.create({
                    data: {
                        memberId: member.id,
                        accountRef: uniqueWalletId,
                        glAccountId: liabilityAccount.id,
                        status: 'ACTIVE',
                        currency: 'KES'
                    }
                })
                ctx.endStep('Create Wallet Record');

                return { member, wallet }
            })

            ctx.captureAfter(result.member);
            revalidatePath('/dashboard/members')
            return {
                success: true,
                data: result.member,
                memberNumber: result.member.memberNumber,
                walletId: result.wallet.accountRef
            }
        } catch (error: any) {
            ctx.setErrorCode('REGISTRATION_FAILED');
            return { success: false, error: error.message || "Registration failed." }
        }
    }
);
