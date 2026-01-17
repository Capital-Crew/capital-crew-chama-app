'use server'

import prisma from "@/lib/prisma";
import { serializeFinancials } from "@/lib/safe-serialization";

export async function getTransactionLedger(transactionId: string) {
    try {
        const ledgerEntry = await prisma.ledgerTransaction.findFirst({
            where: {
                // We check both internal reference (ID) and external reference (Receipt)
                // giving priority to the direct ID link which is more reliable
                OR: [
                    { referenceId: transactionId },
                    // We can also check by receipt if we fetch the transaction first, 
                    // but usually referenceId is enough if the system is working correctly.
                ]
            },
            include: {
                ledgerEntries: {
                    include: {
                        ledgerAccount: true
                    }
                }
            }
        });

        if (!ledgerEntry) {
            // Try fallback: Get transaction receipt and search by externalReferenceId
            const tx = await prisma.transaction.findUnique({
                where: { id: transactionId }
            });

            if (tx?.mpesaReceiptNumber) {
                const fallbackEntry = await prisma.ledgerTransaction.findUnique({
                    where: { externalReferenceId: tx.mpesaReceiptNumber },
                    include: {
                        ledgerEntries: {
                            include: { ledgerAccount: true }
                        }
                    }
                });
                return serializeFinancials(fallbackEntry);
            }
            return null;
        }

        return serializeFinancials(ledgerEntry);
    } catch (error) {
        console.error("Error fetching ledger:", error);
        return null;
    }
}
