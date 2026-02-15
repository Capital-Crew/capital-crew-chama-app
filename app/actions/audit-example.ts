'use server'

import { withAudit } from "@/lib/with-audit";
import { AuditContext } from "@/lib/audit-context";
import { AuditLogAction } from "@prisma/client";

/**
 * Example Server Action demonstrating "Smart Summary" Auditing.
 * 
 * Usage:
 * await approveLoanExample('loan-123');
 */
export const approveLoanExample = withAudit(
    AuditLogAction.LOAN_APPROVED, // Or 'LOAN_APPROVAL' if you change the type
    async (loanId: string) => {
        // 1. Simulate fetching loan
        await new Promise(resolve => setTimeout(resolve, 100)); // Fake delay
        AuditContext.track('Fetched Loan Details', { loanId });

        // 2. Business Logic: Calculate Interest
        const interestRate = 12.5;
        AuditContext.track('Calculated Interest', { rate: interestRate });

        // 3. Business Logic: Check Balance
        const balance = 50000;
        if (balance < 1000) {
            throw new Error("Insufficient funds");
        }
        AuditContext.track('Checked Wallet Balance', { balance });

        // 4. Business Logic: Disburse
        AuditContext.track('Disbursed Funds', { amount: 5000, recipient: 'Wallet X' });

        return { success: true, message: "Loan Approved" };
    }
);
