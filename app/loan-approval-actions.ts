"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
    LoanStatus,
    ApprovalStatus,
    LoanEventType,
    NotificationType,
    AuditLogAction,
    SystemAccountType,
    UserRole,
} from "@prisma/client";
import { LoanBalanceService } from "@/services/loan-balance";
import { getSystemMappingsDict } from "./actions/system-accounting";
import { getSaccoSettings } from "./sacco-settings-actions";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { WalletService } from "@/lib/services/WalletService";
import { LoanService } from "@/services/loan-service";
import { withAudit } from "@/lib/with-audit";
import { AuditContext } from "@/lib/audit-context";

// Use global db instance
const prisma = db;

/**
 * Toggle Concurrent Application Exemption
 * Allows a member to apply for another loan even if this one is pending/approved.
 */
export const toggleConcurrentExemption = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'LOAN', apiRoute: '/api/loans/exemption/toggle' },
    async (ctx, loanId: string, allowed: boolean) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error("Unauthorized");
        }

        const userRole = session.user.role;
        const isAdmin = ["SYSTEM_ADMIN", "CHAIRPERSON", "TREASURER", "SECRETARY"].includes(userRole);

        if (!isAdmin) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error("Only admins can toggle exemptions");
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Capture Initial State');
        const loan = await prisma.loan.findUnique({ where: { id: loanId } });
        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error("Loan not found");
        }
        ctx.captureBefore('Loan', loanId, loan);
        ctx.endStep('Capture Initial State');

        ctx.beginStep('Update Exemption');
        const currentExemptions = (loan.feeExemptions as any) || {};
        const updatedLoan = await prisma.loan.update({
            where: { id: loanId },
            data: {
                feeExemptions: {
                    ...currentExemptions,
                    allowConcurrentApplication: allowed,
                },
            },
        });
        ctx.captureAfter(updatedLoan);
        ctx.endStep('Update Exemption');

        revalidatePath("/loans");
        return { success: true };
    }
);

/**
 * Submit a loan approval vote
 */
export const submitLoanApproval = withAudit(
    { actionType: AuditLogAction.LOAN_VOTE_CAST, domain: 'LOAN', apiRoute: '/api/loans/approve' },
    async (ctx, loanId: string, decision: "APPROVED" | "REJECTED", notes: string) => {
        ctx.beginStep('Validate Authorization');
        const session = await auth();

        // @ts-ignore
        if (!session?.user?.memberId) {
            ctx.setErrorCode('UNAUTHORIZED_ACCESS');
            ctx.failStep('Validate Authorization', new Error("Unauthorized: You must be a member to approve loans"));
            throw new Error("Unauthorized: You must be a member to approve loans");
        }

        // @ts-ignore
        const approverId = session.user.memberId;
        const userRole = session.user.role;
        // @ts-ignore
        const userPermissions = session.user.permissions;

        const roleHasPermission = [
            "SYSTEM_ADMIN",
            "CHAIRPERSON",
            "TREASURER",
        ].includes(userRole);

        let hasGranularPermission = false;
        if (userPermissions) {
            if (Array.isArray(userPermissions)) {
                hasGranularPermission =
                    userPermissions.includes("APPROVE_LOANS") ||
                    userPermissions.includes("ALL");
            } else if (typeof userPermissions === "object") {
                // @ts-ignore
                hasGranularPermission =
                    userPermissions["APPROVE_LOANS"] === true ||
                    userPermissions["canApprove"] === true ||
                    userPermissions["ALL"] === true;
            }
        }

        if (!roleHasPermission && !hasGranularPermission) {
            ctx.beginStep('Check Delegated Authority');
            const activeDelegations = await prisma.approvalDelegation.findMany({
                where: {
                    toUserId: session.user.id,
                    revokedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                    AND: [{ OR: [{ entityId: loanId, entityType: 'LOAN' }, { entityId: null }] }],
                },
                include: { fromUser: true },
            });

            // @ts-ignore - relation fromUser exists in schema
            const hasValidDelegation = activeDelegations.some((d) =>
                ["SYSTEM_ADMIN", "CHAIRPERSON", "TREASURER"].includes(d.fromUser.role)
            );

            if (!hasValidDelegation) {
                ctx.setErrorCode('INSUFFICIENT_PERMISSIONS');
                ctx.failStep('Validate Authorization', new Error("Unauthorized: Missing permissions"));
                throw new Error("Unauthorized: You do not have permission to approve loans");
            }
            ctx.endStep('Check Delegated Authority');
        }
        ctx.endStep('Validate Authorization');

        ctx.beginStep('Retrieve Loan Record');
        const loan = await prisma.loan.findUniqueOrThrow({
            where: { id: loanId },
            include: { approvals: true },
        });
        ctx.captureBefore('Loan', loan.id, loan);
        ctx.endStep('Retrieve Loan Record');

        if (loan.status !== LoanStatus.PENDING_APPROVAL) {
            ctx.setErrorCode('INVALID_STATUS_TRANSITION');
            ctx.failStep('Check Status', new Error(`Cannot vote on loan in ${loan.status} status`));
            throw new Error("Loan is not in pending approval status");
        }

        ctx.beginStep('Process Vote with Workflow Engine');
        const workflowRequest = await prisma.workflowRequest.findFirst({
            where: {
                entityId: loanId,
                entityType: 'LOAN',
                status: 'PENDING'
            },
            include: { currentStage: true }
        });

        if (!workflowRequest) {
            ctx.setErrorCode('WORKFLOW_NOT_FOUND');
            ctx.failStep('Process Vote with Workflow Engine', new Error("No active workflow request found for this loan"));
            throw new Error("No active workflow request found for this loan. This loan might be using the legacy approval system, please contact support.");
        }

        // Bridge legacy decision to workflow engine
        const { processWorkflowAction } = await import('./actions/workflow-engine');
        const result = await processWorkflowAction(workflowRequest.id, decision === 'APPROVED' ? 'APPROVED' : 'REJECTED', notes);

        // Fetch updated loan status for context
        const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });

        ctx.endStep('Process Vote with Workflow Engine', { finalStatus: updatedLoan?.status });

        if (updatedLoan) {
            ctx.captureAfter(updatedLoan);
        }

        revalidatePath(`/loans/${loanId}`);
        revalidatePath("/dashboard");
        return { status: updatedLoan?.status === 'APPROVED' ? 'APPROVED' : updatedLoan?.status === 'REJECTED' ? 'REJECTED' : 'PENDING_QUORUM', updated: updatedLoan };
    }
);

/**
 * Reject a loan application specifically
 */
export async function rejectLoan(loanId: string, reason: string) {
    return submitLoanApproval(loanId, "REJECTED", reason);
}

/**
 * Approve a loan application specifically
 */
export async function approveLoan(
    loanId: string,
    notes: string = "Approved via dashboard",
) {
    return submitLoanApproval(loanId, "APPROVED", notes);
}

/**
 * Disburse Loan (Wallet Integration)
 * Using the AccountingEngine for strict double-entry
 */
export const disburseLoanToWallet = withAudit(
    { actionType: AuditLogAction.LOAN_DISBURSED, domain: 'LOAN', apiRoute: '/api/loans/disburse' },
    async (ctx, loanId: string) => {
        ctx.beginStep('Validate Disbursement Request');
        const session = await auth();
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            ctx.failStep('Validate Disbursement Request', new Error("Authentication required"));
            throw new Error("Unauthorized: Authentication required");
        }

        const result = await prisma.$transaction(
            async (tx) => {
                ctx.beginStep('Fetch Loan and Product State');
                const loan = await tx.loan.findUnique({
                    where: { id: loanId },
                    include: {
                        member: { include: { wallet: true } },
                        loanProduct: { include: { accountingMappings: true } },
                        topUps: true,
                    },
                });

                if (!loan) throw new Error("Loan not found");
                ctx.captureBefore('Loan', loan.id, loan);
                ctx.endStep('Fetch Loan and Product State');

                ctx.beginStep('Check Permissions');
                const userRole = session!.user.role;
                const hasRolePermission = ["TREASURER", "CHAIRPERSON", "SYSTEM_ADMIN"].includes(userRole);
                const isOwner = session!.user.memberId === loan.memberId;

                // @ts-ignore
                const userPermissions = session!.user.permissions;
                let hasGranularPermission = false;
                if (userPermissions) {
                    if (Array.isArray(userPermissions)) {
                        hasGranularPermission = userPermissions.includes("DISBURSE_LOANS") || userPermissions.includes("ALL");
                    } else if (typeof userPermissions === "object") {
                        // @ts-ignore
                        hasGranularPermission = userPermissions["DISBURSE_LOANS"] === true || userPermissions["ALL"] === true;
                    }
                }

                if (!hasRolePermission && !hasGranularPermission && !isOwner) {
                    throw new Error("Unauthorized: Insufficient permissions to disburse");
                }
                ctx.endStep('Check Permissions');

                if (loan.status !== "APPROVED") {
                    throw new Error(`Invalid status: ${loan.status}`);
                }

                ctx.beginStep('Post Disbursement Journal Entry');

                ctx.beginStep('Calculate Disbursements and Deductions');
                // 1. Calculate Amounts using Decimal for precision
                const dPrincipal = new Prisma.Decimal(loan.amount || 0).toDecimalPlaces(2);
                const dProcessingFee = new Prisma.Decimal(loan.processingFee || 0).toDecimalPlaces(2);
                const dInsuranceFee = new Prisma.Decimal(loan.insuranceFee || 0).toDecimalPlaces(2);
                const dShareDeduction = new Prisma.Decimal(loan.shareCapitalDeduction || 0).toDecimalPlaces(2);

                // Check if loan has already been disbursed
                const existingBalance = Number(loan.outstandingBalance);
                if (existingBalance > 0) {
                    ctx.setErrorCode('ALREADY_DISBURSED');
                    throw new Error(`Loan already disbursed. Balance: ${existingBalance}`);
                }
                ctx.endStep('Calculate Disbursements and Deductions');

                ctx.beginStep('Post Journal Entry');
                // Resolve System Mappings
                const mappings = await getSystemMappingsDict();
                const { DEFAULT_MAPPINGS } = await import("@/lib/accounting/constants");
                const getCode = (type: SystemAccountType) => mappings[type] || DEFAULT_MAPPINGS[type];
                const fundingAccountCode = getCode("EVENT_LOAN_DISBURSEMENT");

                const getAccountIdLocal = async (code: string) => {
                    const acc = await tx.ledgerAccount.findUnique({ where: { code } });
                    if (!acc) throw new Error(`Account ${code} not found`);
                    return acc.id;
                };

                // Resolve Wallet
                const memberWallet = await WalletService.createWallet(loan.memberId, tx);
                const memberWalletAccountId = memberWallet.glAccountId;

                const finalJournalLines: any[] = [];
                let idx = 0;
                let totalDeductionsCredit = new Prisma.Decimal(0);

                // A. DEBIT: Principal
                finalJournalLines.push({
                    accountId: await getAccountIdLocal(fundingAccountCode),
                    accountType: "ASSET",
                    description: `Principal Disbursement - ${loan.loanApplicationNumber}`,
                    debitAmount: dPrincipal,
                    creditAmount: 0,
                    index: idx++,
                });

                // B. CREDIT: Fees
                if (dProcessingFee.gt(0)) {
                    finalJournalLines.push({
                        accountId: await getAccountIdLocal(getCode("INCOME_LOAN_PROCESSING_FEE")),
                        accountType: "INCOME",
                        description: "Processing Fee",
                        debitAmount: 0, creditAmount: dProcessingFee, index: idx++,
                    });
                    totalDeductionsCredit = totalDeductionsCredit.plus(dProcessingFee);
                }

                if (dInsuranceFee.gt(0)) {
                    finalJournalLines.push({
                        accountId: await getAccountIdLocal(getCode("INCOME_GENERAL_FEE")),
                        accountType: "INCOME",
                        description: "Insurance Fee",
                        debitAmount: 0, creditAmount: dInsuranceFee, index: idx++,
                    });
                    totalDeductionsCredit = totalDeductionsCredit.plus(dInsuranceFee);
                }

                const dDerivedNetDisbursement = dPrincipal.minus(totalDeductionsCredit);
                if (dDerivedNetDisbursement.lt(0)) throw new Error("Deductions exceed principal");

                if (dDerivedNetDisbursement.gt(0)) {
                    finalJournalLines.push({
                        accountId: memberWalletAccountId,
                        accountType: "LIABILITY",
                        description: `Net Disbursement to Wallet`,
                        debitAmount: 0, creditAmount: dDerivedNetDisbursement, index: idx++,
                    });
                }

                const je = await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: "LOAN_DISBURSEMENT",
                    referenceId: loan.id,
                    description: `Disbursement for Loan ${loan.loanApplicationNumber}`,
                    createdBy: session!.user.id!,
                    createdByName: session!.user.name || "Unknown",
                    lines: finalJournalLines,
                }, tx);
                ctx.endStep('Post Journal Entry', { jeId: je.id });

                ctx.beginStep('Update Loan State');
                // Update System State
                await tx.loanTransaction.create({
                    data: {
                        loanId: loan.id,
                        type: "DISBURSEMENT",
                        amount: dPrincipal,
                        description: `Disbursement (Ref: ${je.entryNumber})`,
                        referenceId: je.id,
                        postedAt: new Date(),
                        transactionDate: new Date(),
                    },
                });

                const strictBalance = await LoanBalanceService.updateLoanBalance(loanId, tx);

                const updatedLoan = await tx.loan.update({
                    where: { id: loanId },
                    data: {
                        status: "ACTIVE",
                        current_balance: strictBalance.toNumber(),
                        outstandingBalance: strictBalance,
                        disbursementDate: new Date(),
                    },
                });
                ctx.captureAfter(updatedLoan);
                ctx.endStep('Update Loan State');

                return { success: true, jeId: je.id };
            },
            { maxWait: 15000, timeout: 45000 }
        );

        revalidatePath(`/loans/${loanId}`);
        return result;
    }
);

/**
 * Get loan journey (timeline of events)
 */
export async function getLoanJourney(loanId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const events = await prisma.loanJourneyEvent.findMany({
        where: { loanId },
        orderBy: { timestamp: "asc" },
    });
    return events;
}

// --- Helpers ---
async function getAccountId(tx: any, code: string) {
    if (!code)
        throw new Error(
            "gl account code is undefined - check system account mappings configuration",
        );

    // Try to find existing
    const acc = await tx.ledgerAccount.findUnique({ where: { code } });
    if (acc) return acc.id;

    // Auto-seed if missing to prevent FK crashes

    // Simple type deduction based on standard accounting codes
    let type = "ASSET";
    let name = "Auto-Generated Asset";

    // AccountType Enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    // '4' is usually Income/Revenue
    if (code.startsWith("1")) {
        type = "ASSET";
        name = "Asset Account";
    } else if (code.startsWith("2")) {
        type = "LIABILITY";
        name = "Liability Account";
    } else if (code.startsWith("3")) {
        type = "EQUITY";
        name = "Equity Account";
    } else if (code.startsWith("4")) {
        type = "REVENUE";
        name = "Revenue Account";
    } // Changing INCOME to REVENUE
    else if (code.startsWith("5")) {
        type = "EXPENSE";
        name = "Expense Account";
    }

    // Specific names based on known codes
    if (code === "1200") name = "Loan Portfolio";
    if (code === "2000") name = "Member Deposits / Wallets";
    if (code === "3012") name = "Member Withdrawable Wallet";
    if (code === "4000") name = "Processing Fee Income";
    if (code === "4200") name = "Insurance Fee Income";

    try {
        const newAcc = await tx.ledgerAccount.create({
            data: {
                code,
                name: `${name} (${code})`,
                type: type as any,
                isActive: true,
                allowManualEntry: true,
            },
        });
        return newAcc.id;
    } catch (e) {
        // Handle race condition
        const retry = await tx.ledgerAccount.findUnique({ where: { code } });
        if (retry) return retry.id;
        throw new Error(`Failed to create GL Account ${code}`);
    }
}

function getDefaultCode(type: string) {
    switch (type) {
        case "LOAN_PORTFOLIO":
            return "1021"; // Principal Loans to Members
        case "FEE_INCOME":
            return "4021"; // Processing Fees
        case "INTEREST_INCOME":
            return "4011"; // Interest on Loans
        case "PENALTY_INCOME":
            return "4012"; // Interest on Penalties
        default:
            return "9999";
    }
}

/**
 * Toggle Member's ability to approve loans
 */
export async function toggleMemberApprovalRight(memberId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check permissions (Only Admin/Chair/Secretary/Treasurer)
    const allowedRoles = [
        "SYSTEM_ADMIN",
        "CHAIRPERSON",
        "SECRETARY",
        "TREASURER",
        "SYSTEM_ADMINISTRATOR",
    ];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
        throw new Error("Insufficient permissions to manage approval rights");
    }

    // Note: This function remains as is, as it's separate from loan processing
    // Implementation would go here if needed...
}

function parsedAmount(amount: any) {
    return Number(amount).toLocaleString("en-KE", {
        style: "currency",
        currency: "KES",
    });
}
