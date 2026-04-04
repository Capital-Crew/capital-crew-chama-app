// lib/fines/accrueContributionFines.ts
import { db } from "@/lib/db";
import { calculateContributionFine } from "./calculateContributionFine";
import { postFineJournalEntry } from "./postFineJournalEntry";

/**
 * Nightly Accrual Job
 * Process all overdue contributions and record daily fine increments.
 */
export async function accrueContributionFines(businessDate: Date) {
  // Ensure we are working with start of day UTC
  const calcDate = new Date(Date.UTC(businessDate.getUTCFullYear(), businessDate.getUTCMonth(), businessDate.getUTCDate()));

  // 1. Fetch all contributions that are potentially overdue
  const overdue = await db.contribution.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      dueDate: { lt: calcDate },
    },
    include: { product: true },
  });

  console.log(`[FineAccrual] Processing ${overdue.length} potentially overdue contributions for ${calcDate.toISOString().split('T')[0]}`);

  let successCount = 0;
  let errorCount = 0;

  for (const c of overdue) {
    try {
      // 2. Calculate current fine state
      const fine = calculateContributionFine({
        contributionId:   c.id,
        dueDate:          c.dueDate,
        scheduledAmount:  c.scheduledAmount,
        amountPaid:       c.amountPaid,
        status:           c.status as string,
        flatFeeApplied:   c.flatFeeApplied   || c.product.flatFee,
        dailyRateApplied: c.dailyRateApplied || c.product.dailyRatePercent,
        fineEnabled:      c.product.fineEnabled,
        calculationDate:  calcDate,
      });

      // 3. Skip if no fine is applicable (e.g. grace period or disabled)
      if (fine.daysPastDue === 0) continue;

      // 4. Snapshot current fine state (Idempotent upsert)
      await db.fineSnapshot.upsert({
        where: {
          contributionId_snapshotDate: {
            contributionId: c.id,
            snapshotDate:   calcDate,
          },
        },
        create: {
          contributionId: c.id,
          snapshotDate:   calcDate,
          daysPastDue:    fine.daysPastDue,
          flatFee:        fine.flatFee,
          dailyPenalty:   fine.dailyPenalty,
          totalFine:      fine.totalFine,
        },
        update: {
          daysPastDue:  fine.daysPastDue,
          dailyPenalty: fine.dailyPenalty,
          totalFine:    fine.totalFine,
        },
      });

      // 5. Update Contribution status to OVERDUE and snapshot rates if not already done
      if (c.status !== 'OVERDUE') {
        await db.contribution.update({
          where: { id: c.id },
          data: {
            status:           'OVERDUE',
            flatFeeApplied:   c.product.flatFee,
            dailyRateApplied: c.product.dailyRatePercent,
            fineStartDate:    calcDate,
          },
        });
      }

      // 6. Calculate is there's an incremental shift for the ledger
      // For Flat Fee: Posted on Day 1
      // For Daily Penalty: Daily increment is (Principal * rate/100)
      
      const dailyIncrement = c.scheduledAmount * (fine.dailyRatePercent / 100);
      const flatIncrement  = fine.daysPastDue === 1 ? fine.flatFee : 0;
      const totalIncrement = round2(dailyIncrement + flatIncrement);

      if (totalIncrement > 0) {
        await postFineJournalEntry({
          contributionId: c.id,
          memberId:       c.memberId,
          date:           calcDate,
          amount:         totalIncrement,
        });
      }
      
      successCount++;
    } catch (error) {
      console.error(`[FineAccrual] Error processing contribution ${c.id}:`, error);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

function round2(n: number) { return Math.round(n * 100) / 100 }
