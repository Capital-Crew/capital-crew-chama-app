'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { WalletService } from '@/lib/services/WalletService'
import { Prisma, AuditLogAction } from '@prisma/client'
import { z } from 'zod'
import { withAudit } from '@/lib/with-audit'

const WithdrawSchema = z.object({
    memberId: z.string().cuid().or(z.string().uuid()),
    amount: z.number().positive('Withdrawal amount must be greater than zero'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long')
})

/**
 * Withdraw Funds
 */
export const withdrawFunds = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'FINANCE', apiRoute: '/api/wallet/withdraw' },
    async (ctx, input: {
        memberId: string
        amount: number
        description: string
    }) => {
        ctx.beginStep('Validate Withdrawal Request');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const validated = WithdrawSchema.safeParse(input)
        if (!validated.success) {
            ctx.setErrorCode('VALIDATION_ERROR');
            throw new Error(`Validation Error: ${validated.error.issues.map((e: any) => e.message).join(', ')}`)
        }
        const { memberId, amount, description } = validated.data

        const member = await prisma.member.findUnique({
            where: { id: memberId }
        })

        if (!member) {
            ctx.setErrorCode('MEMBER_NOT_FOUND');
            throw new Error('Member not found')
        }
        ctx.captureBefore('Member', member.id, member);

        const withdrawableBalance = await getMemberWalletBalance(memberId)
        if (amount > withdrawableBalance) {
            ctx.setErrorCode('INSUFFICIENT_FUNDS');
            throw new Error(`Insufficient withdrawable balance`)
        }
        ctx.endStep('Validate Withdrawal Request');

        ctx.beginStep('Resolve System Config');
        const mappings = await getSystemMappingsDict()
        ctx.endStep('Resolve System Config');

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            ctx.beginStep('Pessimistic Locking and Verification');
            const wallet = await WalletService.createWallet(memberId, tx)
            const [lockedAccount] = await tx.$queryRaw<{ balance: any }[]>`
                SELECT "balance" FROM "LedgerAccount"
                WHERE "id" = ${wallet.glAccountId}
                FOR UPDATE
            `

            if (!lockedAccount) {
                ctx.setErrorCode('SYSTEM_ERROR');
                throw new Error('Ledger Account not found during withdrawal lock.')
            }

            const currentBalance = Number(lockedAccount.balance)
            if (amount > currentBalance) {
                ctx.setErrorCode('INSUFFICIENT_FUNDS');
                throw new Error(`Insufficient balance after lock verification`)
            }
            ctx.endStep('Pessimistic Locking and Verification');

            ctx.beginStep('Post Withdrawal Journal Entry');
            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'SAVINGS_WITHDRAWAL',
                referenceId: memberId,
                description: `Withdrawal - ${member.name}`,
                notes: description,
                externalReferenceId: `WD-${Date.now()}`,
                lines: [
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: amount,
                        creditAmount: 0,
                        description: `${member.name} withdrawal`
                    },
                    {
                        accountCode: mappings.EVENT_CASH_WITHDRAWAL || mappings.CASH_ON_HAND,
                        debitAmount: 0,
                        creditAmount: amount,
                        description: 'Cash paid out'
                    }
                ],
                createdBy: session.user.id!,
                createdByName: session.user.name || 'System'
            }, tx)
            ctx.endStep('Post Withdrawal Journal Entry', { jeId: journalEntry.id });

            ctx.beginStep('Record Wallet Transaction snapshot');
            const walletTx = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount: new Prisma.Decimal(amount),
                    description: `Withdrawal: ${description}`,
                    balanceAfter: new Prisma.Decimal(currentBalance - amount),
                    immutable: true
                }
            })
            ctx.endStep('Record Wallet Transaction snapshot');

            return {
                success: true,
                journalEntryId: journalEntry.id,
                newWithdrawableBalance: currentBalance - amount
            }
        })

        const updatedMember = await prisma.member.findUnique({ where: { id: memberId } });
        if (updatedMember) ctx.captureAfter(updatedMember);

        revalidatePath('/wallet')
        revalidatePath('/dashboard')
        revalidatePath('/accounts')

        return result;
    }
);

/**
 * Get withdrawable balance for a member
 */
export async function getWithdrawableBalance(memberId: string): Promise<number> {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const validatedId = z.string().cuid().or(z.string().uuid()).safeParse(memberId)
    if (!validatedId.success) throw new Error('Invalid member ID format')

    return await getMemberWalletBalance(memberId)
}
