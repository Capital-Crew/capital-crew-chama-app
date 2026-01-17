'use server'

import { ReconciliationService } from "@/lib/services/reconciliation-service";
import { revalidatePath } from "next/cache";

export async function checkStatusAction(transactionId: string) {
    try {
        const result = await ReconciliationService.reconcileTransaction(transactionId);

        // Revalidate pages to show updated status
        revalidatePath('/accounting');
        revalidatePath('/dashboard');

        return result;
    } catch (error: any) {
        console.error("Manual Reconciliation Error:", error);
        return {
            success: false,
            status: 'ERROR',
            message: error.message || "Failed to check status"
        };
    }
}

export async function resolveManuallyAction(transactionId: string, mpesaReceiptNumber: string) {
    try {
        const result = await ReconciliationService.resolveManually(transactionId, mpesaReceiptNumber);

        revalidatePath('/accounting');
        revalidatePath('/dashboard');

        return result;
    } catch (error: any) {
        console.error("Manual Resolution Error:", error);
        return {
            success: false,
            message: error.message || "Failed to resolve transaction"
        };
    }
}

export async function syncLedgerAction(transactionId: string) {
    try {
        const result = await ReconciliationService.syncTransactionLedger(transactionId);
        revalidatePath('/accounting');
        return result;
    } catch (error: any) {
        console.error("Sync Ledger Error:", error);
        return { success: false, message: error.message || "Failed to sync ledger" };
    }
}
