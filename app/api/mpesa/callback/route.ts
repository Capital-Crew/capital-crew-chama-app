import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { WalletService } from "@/lib/services/WalletService";
import { SystemAccountType, ReferenceType, Prisma } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { Body } = payload;

        if (!Body || !Body.stkCallback) {
            console.error("Invalid M-Pesa Callback Payload", payload);
            return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
        }

        const { stkCallback } = Body;
        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

        console.log("M-Pesa Callback Received:", { CheckoutRequestID, ResultCode, ResultDesc });

        const transaction = await prisma.transaction.findUnique({
            where: { checkoutRequestId: CheckoutRequestID },
        });

        if (!transaction) {
            console.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
            // Return success to stop M-Pesa from retrying
            return NextResponse.json({ result: "Transaction not found" });
        }

        if (ResultCode === 0) {
            // Success
            let mpesaReceiptNumber = null;
            if (CallbackMetadata && CallbackMetadata.Item) {
                const receiptItem = CallbackMetadata.Item.find((item: any) => item.Name === "MpesaReceiptNumber");
                if (receiptItem) {
                    mpesaReceiptNumber = receiptItem.Value;
                }
            }

            // 1. Update Transaction Status
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "COMPLETED",
                    mpesaReceiptNumber: mpesaReceiptNumber,
                },
            });

            // 2. Ledger & Wallet Integration
            try {
                // Execute atomically
                await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                    let member = null;

                    if (transaction.memberId) {
                        member = await tx.member.findUnique({ where: { id: transaction.memberId } });
                    }

                    if (!member) {
                        const memberContact = await tx.memberContact.findUnique({
                            where: { mobile: transaction.phoneNumber },
                            include: { member: true },
                        });
                        member = memberContact?.member || null;
                    }

                    if (member) {
                        // Get/Create Wallet (Pass TX)
                        const wallet = await WalletService.createWallet(member.id, tx);

                        // Get M-Pesa Asset Account (EVENT_CASH_DEPOSIT)
                        const assetAccountCode = await tx.systemAccountingMapping.findUnique({
                            where: { type: SystemAccountType.EVENT_CASH_DEPOSIT },
                            include: { account: true }
                        });

                        if (!assetAccountCode?.account) {
                            throw new Error("System Asset Account (EVENT_CASH_DEPOSIT) not configured.");
                        }

                        // Post Journal Entry
                        const amount = Number(transaction.amount);
                        await AccountingEngine.postJournalEntry({
                            transactionDate: new Date(),
                            referenceType: ReferenceType.SAVINGS_DEPOSIT,
                            referenceId: transaction.id,
                            description: `M-Pesa Deposit: ${mpesaReceiptNumber || 'Unknown'}`,
                            createdBy: "SYSTEM",
                            createdByName: "M-Pesa Integration",
                            externalReferenceId: mpesaReceiptNumber,
                            lines: [
                                {
                                    accountId: assetAccountCode.account.id,
                                    debitAmount: amount, // Increase Asset
                                    creditAmount: 0,
                                    description: `Cash Deposit from ${transaction.phoneNumber}`
                                },
                                {
                                    accountId: wallet.glAccountId,
                                    debitAmount: 0,
                                    creditAmount: amount, // Increase Liability (Wallet Balance)
                                    description: `Credit to Wallet (${member.memberNumber})`
                                }
                            ]
                        }, tx);

                        // Fetch New Balance for Snapshot (Using TX to see the update)
                        // Note: AccountingEngine.postJournalEntry now updates the balance column, so this should be fast.
                        // We use the same 'tx' so we see the uncommitted changes.
                        // We need to import: getMemberWalletBalance
                        // But wait, I can just recalculate:
                        // const currentBalance = await getMemberWalletBalance(member.id, tx)

                        // For now, let's import getMemberWalletBalance at the top of file or use AccountingEngine.getAccountBalance logic here?
                        // Better to rely on helper if possible, but importing might be a separate step.
                        // I will add the import in a separate Replace if needed, but I can assume it's available or use AccountingEngine specific call?
                        // check imports lines 1-6

                        // Let's use AccountingEngine if available.

                        // Get current balance from Ledger Account
                        // Note: We query the LedgerAccount directly to get the updated balance after the journal posting
                        const updatedWalletGL = await tx.ledgerAccount.findUnique({
                            where: { id: wallet.glAccountId }
                        })
                        const balanceAfter = updatedWalletGL?.balance || 0

                        // 3. Create Wallet Transaction (Member Statement)
                        await tx.walletTransaction.create({
                            data: {
                                walletId: wallet.id,
                                type: 'DEPOSIT', // Using DEPOSIT as confirmed in Enum
                                amount: amount,
                                balanceAfter: balanceAfter,
                                description: `Deposit via M-Pesa (${mpesaReceiptNumber})`
                            }
                        });

                        console.log(`Ledger entry posted for transaction ${transaction.id}`);
                    } else {
                        console.warn(`Member not found for M-Pesa deposit phone: ${transaction.phoneNumber}`);
                    }
                }, {
                    maxWait: 10000,
                    timeout: 20000
                });

            } catch (ledgerError) {
                console.error("Ledger Posting Failed for M-Pesa Deposit:", ledgerError);
                // We do NOT fail the callback response, as the payment itself was successful.
                // TODO: Flag for reconciliation.
            }

        } else {
            // Failed or Cancelled
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "FAILED",
                    failureReason: ResultDesc || "Unknown Error",
                },
            });
        }

        return NextResponse.json({ result: "Success" });
    } catch (error) {
        console.error("Callback Processing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
