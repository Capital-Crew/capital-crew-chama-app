// lib/fines/postFineJournalEntry.ts
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";

export async function postFineJournalEntry(input: {
  contributionId: string
  memberId:       string
  date:           Date
  amount:         number
}) {
  // DR  Fine Receivable  (Asset ↑)    — institution is owed
  // CR  Fine Revenue     (Revenue ↑)  — revenue recognised daily

  // We use AccountingEngine to ensure double-entry validation and balance updates.
  // Account codes 'FINE_RECEIVABLE' and 'FINE_REVENUE' must be configured in the system.

  await AccountingEngine.postJournalEntry({
    transactionDate: input.date,
    referenceType: 'CONTRIBUTION_PENALTY_ACCRUAL' as any,
    referenceId: input.contributionId,
    description: `Contribution fine accrual - Daily Increment`,
    createdBy: 'SYSTEM',
    createdByName: 'Fine Accrual Engine',
    lines: [
      {
        accountCode: 'FINE_RECEIVABLE',
        debitAmount: input.amount,
        creditAmount: 0,
        description: `Fine Receivable Accrual`
      },
      {
        accountCode: 'FINE_REVENUE',
        debitAmount: 0,
        creditAmount: input.amount,
        description: `Fine Revenue Recognition`
      }
    ]
  });
}
