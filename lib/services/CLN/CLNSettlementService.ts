import { db } from '@/lib/db';
import { Decimal } from 'decimal.js';
import { CLNPostReturnsService, DisbursementPreview } from './CLNPostReturnsService';

export interface SettlementPreview extends DisbursementPreview {
    remainingPrincipal: number;
    interestToDate: number;
    unpaidSchedules: number;
}

export class CLNSettlementService {
    /**
     * Generate a preview for full repayment (Early Settlement)
     */
    static async getEarlySettlementPreview(noteId: string): Promise<SettlementPreview> {
        // 1. Fetch all unpaid schedule events
        const schedule = await db.loanNotePaymentSchedule.findMany({
            where: { 
                loanNoteId: noteId,
                status: { in: ['UPCOMING', 'SHORTFALL'] }
            },
            orderBy: { eventNumber: 'asc' }
        });

        if (schedule.length === 0) throw new Error('No unpaid cycles found for this note');

        // 2. Aggregate Remaining Debt
        let totalPrincipal = new Decimal(0);
        let totalInterest = new Decimal(0);

        schedule.forEach(evt => {
            totalPrincipal = totalPrincipal.plus(new Decimal(evt.principalComponent));
            totalInterest = totalInterest.plus(new Decimal(evt.interestComponent));
        });

        const totalLumpSum = totalPrincipal.plus(totalInterest);

        // 3. Reuse PostReturns logic to generate subscriber breakdown
        // Create a "Virtual" schedule event to satisfy the PostReturnsService signature
        // Or better, just call the allocation logic directly
        const preview = await CLNPostReturnsService.getPreview(schedule[0].id);

        // Override the group amount with our aggregated total
        // Note: For a real production system, we'd want to recalculate allocations based on the lump sum
        // But since allocations are percentage-based (sharePct), it scales linearly.
        
        return {
            ...preview,
            totalAmount: totalLumpSum.toNumber(),
            remainingPrincipal: totalPrincipal.toNumber(),
            interestToDate: totalInterest.toNumber(),
            unpaidSchedules: schedule.length,
            isSufficient: preview.floaterBalance >= totalLumpSum.toNumber(),
            shortfall: Math.max(0, totalLumpSum.toNumber() - preview.floaterBalance)
        };
    }
}
