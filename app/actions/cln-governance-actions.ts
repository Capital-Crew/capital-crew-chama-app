'use server'

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { withIdempotency } from '@/lib/idempotency';
import { Decimal } from 'decimal.js';
import { revalidatePath } from 'next/cache';

/**
 * Propose a Group Investment
 */
export async function proposeGroupInvestment(data: {
    groupId: string;
    loanNoteId: string;
    proposedAmount: number;
    idempotencyKey: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, message: 'Unauthorized' };

    return await withIdempotency({
        key: data.idempotencyKey,
        path: 'proposeGroupInvestment',
        businessLogic: async () => {
            const { groupId, loanNoteId, proposedAmount } = data;

            const group = await db.group.findUnique({
                where: { id: groupId },
                include: { wallet: true, riskConfig: true, committeeMembers: true }
            });

            if (!group || !group.wallet || !group.riskConfig) {
                return { success: false, message: 'Group configuration incomplete' };
            }

            const note = await db.loanNote.findUnique({ where: { id: loanNoteId } });
            if (!note || note.status !== 'OPEN') {
                return { success: false, message: 'Loan note not available' };
            }

            // 1. Risk Pre-check
            const treasuryBalance = group.wallet.balance;
            const pctOfTreasury = new Decimal(proposedAmount).dividedBy(treasuryBalance).times(100);

            if (pctOfTreasury.greaterThan(group.riskConfig.maxAllocationPct)) {
                return { success: false, message: `Investment exceeds max allocation of ${group.riskConfig.maxAllocationPct}%` };
            }

            // 2. Create Proposal
            const proposal = await db.groupInvestmentProposal.create({
                data: {
                    groupId,
                    loanNoteId,
                    proposedBy: session.user.id!,
                    proposedAmount: new Decimal(proposedAmount),
                    treasuryBalanceAtProposal: treasuryBalance,
                    pctOfTreasury: pctOfTreasury,
                    postInvestmentBalance: treasuryBalance.minus(proposedAmount),
                    reserveAfterInvestment: treasuryBalance.minus(proposedAmount).dividedBy(treasuryBalance).times(100),
                    status: 'PENDING_COMMITTEE_APPROVAL',
                    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hour window
                    businessDate: new Date()
                }
            });

            revalidatePath(`/groups/${groupId}/investments`);
            return { success: true, data: proposal };
        }
    });
}

/**
 * Cast a vote on a group investment proposal
 * Rule: Unanimous approval required.
 */
export async function castProposalVote(params: {
    proposalId: string;
    vote: 'APPROVE' | 'REJECT';
    comment?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, message: 'Unauthorized' };

    const { proposalId, vote, comment } = params;

    const proposal = await db.groupInvestmentProposal.findUnique({
        where: { id: proposalId },
        include: {
            group: { include: { committeeMembers: { where: { active: true } } } },
            votes: true
        }
    });

    if (!proposal || proposal.status !== 'PENDING_COMMITTEE_APPROVAL') {
        return { success: false, message: 'Proposal not active for voting' };
    }

    // Check if user is a committee member
    const committeeMember = proposal.group.committeeMembers.find(m => m.userId === session.user.id);
    if (!committeeMember) return { success: false, message: 'You are not a committee member' };

    try {
        const result = await db.$transaction(async (tx) => {
            // 1. Record Vote
            await tx.groupInvestmentProposalVote.create({
                data: {
                    proposalId,
                    voterId: session.user.id!,
                    vote,
                    comment
                }
            });

            if (vote === 'REJECT') {
                // Instantly reject if one person rejects
                await tx.groupInvestmentProposal.update({
                    where: { id: proposalId },
                    data: {
                        status: 'REJECTED',
                        rejectionReason: `Rejected by ${session.user.name}: ${comment}`
                    }
                });
                return 'REJECTED';
            }

            // 2. Check for Unanimity
            const updatedVotes = await tx.groupInvestmentProposalVote.findMany({ where: { proposalId } });
            const totalCommittee = proposal.group.committeeMembers.length;
            const approveCount = updatedVotes.filter(v => v.vote === 'APPROVE').length;

            if (approveCount === totalCommittee) {
                // All approved! Execute investment
                await tx.groupInvestmentProposal.update({
                    where: { id: proposalId },
                    data: { status: 'APPROVED' }
                });

                // 3. Auto-subscribe group to the note
                const noteId = proposal.loanNoteId;
                const groupId = proposal.groupId;
                const amount = Number(proposal.proposedAmount);

                // a. Create Subscription Record
                await tx.loanNoteSubscription.create({
                    data: {
                        loanNoteId: noteId,
                        groupId,
                        subscriberType: 'GROUP',
                        amount: new Decimal(amount),
                        status: 'ACTIVE',
                        businessDate: new Date()
                    }
                });

                // b. Update Note Subscribed Amount
                await tx.loanNote.update({
                    where: { id: noteId },
                    data: {
                        subscribedAmount: { increment: new Decimal(amount) }
                    }
                });

                // c. Post to Ledger (Group Treasury -> Escrow)
                const { CLNAccountingService } = await import('@/lib/services/CLN/CLNAccountingService');
                await CLNAccountingService.postSubscription({
                    groupId,
                    loanNoteId: noteId,
                    amount,
                    idempotencyKey: `GROUP-SUB-${proposalId}-${Date.now()}`,
                    tx
                });

                return 'APPROVED';
            }

            return 'PENDING';
        });

        revalidatePath(`/groups/${proposal.groupId}/investments/${proposalId}`);
        return { success: true, data: result };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: 'You have already voted' };
        return { success: false, message: error.message || 'Voting fail' };
    }
}
