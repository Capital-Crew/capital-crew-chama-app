'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { PostingRules } from '@/lib/accounting/PostingRules'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

const directContributionLoaderSchema = z.object({
    memberId: z.string().min(1, "Member is required"),
    amount: z.number().positive("Amount must be positive"),
    effectiveDate: z.string().min(1, "Effective date is required"),
    description: z.string().optional()
})

export const directLoadContribution = withAudit(
    { actionType: AuditLogAction.MIGRATION, domain: 'CONTRIBUTIONS', apiRoute: '/api/admin/contributions/direct-load' },
    async (ctx, data: unknown) => {
        ctx.beginStep('Validate Admin Session');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(user?.role || '')) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error('Forbidden: Only administrators can use this tool.')
        }
        ctx.endStep('Validate Admin Session');

        ctx.beginStep('Parse & Validate Payload');
        const result = directContributionLoaderSchema.safeParse(data)
        if (!result.success) {
            ctx.setErrorCode('INVALID_PAYLOAD');
            throw new Error('Invalid data: ' + result.error.issues[0].message)
        }
        const { memberId, amount, effectiveDate, description } = result.data

        const member = await db.member.findUnique({ where: { id: memberId } })

        if (!member) throw new Error('Member not found')
        ctx.endStep('Parse & Validate Payload');

        ctx.beginStep('Atomic Contribution Injection');
        try {
            const date = new Date(effectiveDate)
            const actorId = session.user.id!
            const actorName = session.user.name || 'Admin'
            const desc = description || 'Balance Brought Forward'

            await db.$transaction(async (tx) => {
                // STEP 1: Post the GL Journal Entry (Debit Asset, Credit Contributions)
                const mappings = await getSystemMappingsDict()
                const journalEntry = PostingRules.contributionPayment(
                    memberId,
                    member.name,
                    amount,
                    mappings,
                    date,
                    actorId,
                    actorName
                )
                // Override the description with the user's provided description
                journalEntry.description = desc

                const ledgerTrans = await AccountingEngine.postJournalEntry(journalEntry, tx as any)

                // STEP 3: Create the immutable ContributionTransaction record for the UI history
                await tx.contributionTransaction.create({
                    data: {
                        memberId,
                        type: 'CONTRIBUTION',
                        amount: new Prisma.Decimal(amount),
                        description: desc,
                        createdAt: date,
                        createdBy: actorId,
                        creatorName: actorName,
                        ledgerTransactionId: ledgerTrans.id
                    }
                })
            }, {
                timeout: 30000,
                maxWait: 10000
            })
            ctx.endStep('Atomic Contribution Injection');

            ctx.track('contribution_loaded', {
                status: 'success',
                memberId,
                amountLoaded: amount,
                effectiveDate: date.toISOString()
            })

            revalidatePath(`/members/${memberId}`)
            revalidatePath(`/dashboard/loan-management`) // Refresh caches where this might be relevant

            return { success: true, message: 'Contribution balance loaded successfully' }

        } catch (error: any) {
            ctx.setErrorCode('DB_TRANSACTION_FAILED');
            ctx.track('contribution_injection_error', { error: error.message })
            console.error('[DirectContributionLoader]', error)
            throw new Error(`Failed to inject contribution: ${error.message}`)
        }
    }
)
