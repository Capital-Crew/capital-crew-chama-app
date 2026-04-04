'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { calculateContributionFine } from '@/lib/fines/calculateContributionFine'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction } from '@prisma/client'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { WalletService } from '@/lib/services/WalletService'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

export type FineItem = {
    id: string; // unique ID for selection (e.g. MEETING:fineId or CONTRIB:contributionId)
    type: 'MEETING_FINE' | 'CONTRIBUTION_FINE' | 'LEGACY_FINE';
    amount: number;
    reason: string;
    date: Date;
    originalId: string;
}

/**
 * Aggregates all non-loan fines for a member.
 */
export async function getOutstandingNonLoanFines(memberId: string): Promise<FineItem[]> {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // 0. Get User associated with this member
    const user = await prisma.user.findUnique({
        where: { memberId }
    })
    const userId = user?.id

    // 1. Fetch Meeting Fines (AttendanceFine)
    let meetingItems: FineItem[] = []
    if (userId) {
        const meetingFines = await prisma.attendanceFine.findMany({
            where: {
                userId,
                status: 'PENDING'
            },
            include: { meeting: true }
        })

        meetingItems = meetingFines.map(f => ({
            id: `MEETING:${f.id}`,
            type: 'MEETING_FINE',
            amount: Number(f.amount),
            reason: f.reason || `Meeting Fine: ${f.meeting.title}`,
            date: f.createdAt,
            originalId: f.id
        }))
    }

    // 1.5 Fetch Legacy Penalty Bills
    let legacyItems: FineItem[] = []
    if (userId) {
        const legacyBills = await prisma.legacyPenaltyBill.findMany({
            where: {
                userId,
                status: 'PENDING'
            }
        })

        legacyItems = legacyBills.map(b => ({
            id: `LEGACY:${b.id}`,
            type: 'LEGACY_FINE',
            amount: Number(b.amount),
            reason: b.reason || `Legacy Penalty`,
            date: b.createdAt,
            originalId: b.id
        }))
    }

    // 2. Fetch Contribution Fines (Calculated on the fly)
    const contributions = await prisma.contribution.findMany({
        where: {
            memberId,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        },
        include: { product: true }
    })

    const contribItems: FineItem[] = contributions.map(c => {
        const fine = calculateContributionFine({
            contributionId: c.id,
            dueDate: c.dueDate,
            scheduledAmount: c.scheduledAmount,
            amountPaid: c.amountPaid,
            status: c.status,
            flatFeeApplied: c.flatFeeApplied || c.product.flatFee,
            dailyRateApplied: c.dailyRateApplied || c.product.dailyRatePercent,
            fineEnabled: c.product.fineEnabled,
        })

        return {
            id: `CONTRIB:${c.id}`,
            type: 'CONTRIBUTION_FINE',
            amount: fine.totalFine,
            reason: `Late Contribution: ${c.product.name} (Due ${c.dueDate.toLocaleDateString()})`,
            date: c.dueDate,
            originalId: c.id
        }
    }).filter(i => i.amount > 0)

    return [...meetingItems, ...legacyItems, ...contribItems]
}

/**
 * Processes payment for a selection of fines.
 */
export const paySelectedNonLoanFines = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'FINANCE', apiRoute: '/api/wallet/pay-fines' },
    async (ctx, input: {
        memberId: string;
        selections: { id: string; type: 'MEETING_FINE' | 'CONTRIBUTION_FINE' | 'LEGACY_FINE'; amount: number; originalId: string; reason: string }[];
        paymentMethod: 'WALLET' | 'MPESA';
        phoneNumber?: string;
    }) => {
        ctx.beginStep('Validate Fine Payment Request');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const totalAmount = input.selections.reduce((sum, s) => sum + s.amount, 0)
        if (totalAmount <= 0) {
            ctx.setErrorCode('INVALID_AMOUNT');
            throw new Error('Total amount must be greater than zero')
        }

        if (input.paymentMethod === 'WALLET') {
            ctx.beginStep('Wallet Balance Check');
            const walletBalance = await getMemberWalletBalance(input.memberId)
            if (totalAmount > walletBalance) {
                ctx.setErrorCode('INSUFFICIENT_FUNDS');
                throw new Error(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`)
            }

            const mappings = await getSystemMappingsDict()
            const wallet = await WalletService.createWallet(input.memberId)
            const member = await prisma.member.findUnique({ where: { id: input.memberId } })

            if (!mappings.EVENT_MEETING_FINES) {
                ctx.setErrorCode('SYSTEM_CONFIG_ERROR');
                throw new Error('System mapping for EVENT_MEETING_FINES not found')
            }

            ctx.beginStep('Execute Transaction');
            const result = await prisma.$transaction(async (tx) => {
                // 1. Post to Ledger
                const journalEntry = await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'PENALTY',
                    referenceId: input.memberId,
                    description: `Fines & Penalties Payment - ${member?.name}`,
                    notes: input.selections.map(s => s.reason).join(', '),
                    lines: [
                        {
                            accountId: wallet.glAccountId,
                            debitAmount: totalAmount,
                            creditAmount: 0,
                            description: `Fine payment withdrawal`
                        },
                        {
                            accountCode: mappings.EVENT_MEETING_FINES,
                            debitAmount: 0,
                            creditAmount: totalAmount,
                            description: 'Fine income recognized'
                        }
                    ],
                    createdBy: session.user.id,
                    createdByName: session.user.name || 'System'
                })

                // 2. Update DB Records
                for (const sel of input.selections) {
                    switch (sel.type) {
                        case 'MEETING_FINE':
                            await tx.attendanceFine.update({
                                where: { id: sel.originalId },
                                data: { status: 'PAID' }
                            })
                            break
                        case 'LEGACY_FINE':
                            await tx.legacyPenaltyBill.update({
                                where: { id: sel.originalId },
                                data: { status: 'PAID' }
                            })
                            break
                        case 'CONTRIBUTION_FINE':
                            // Record payment event or update balance
                            break
                    }
                }
                
                return { journalEntryId: journalEntry.id };
            })

            revalidatePath('/wallet')
            revalidatePath('/dashboard')
            revalidatePath(`/members/${input.memberId}`)

            return { 
                success: true, 
                message: `Successfully paid KES ${totalAmount.toLocaleString()} in fines.`,
                journalEntryId: result.journalEntryId
            }
        } else {
            ctx.beginStep('Initiate M-Pesa Payment');
            // MPESA flow
            const { initiatePayment } = await import('@/app/actions/payment-actions')
            const result = await initiatePayment({
                amount: totalAmount,
                payingPhone: input.phoneNumber || '',
            })
            return result
        }
    }
)
