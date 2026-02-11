'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * Get SACCO settings (create default if not exists)
 */
export async function getSaccoSettings() {
    let settings = await prisma.saccoSettings.findFirst()

    if (!settings) {
        // Create default settings
        settings = await prisma.saccoSettings.create({
            data: {
                loanMultiplier: 3.0,
                processingFeePercent: 2.0,
                insuranceFeePercent: 1.0,
                shareCapitalBoost: 500,
                penaltyRate: 5.0,
                rescheduleFeePercent: 0.0,
                requiredApprovalsReschedule: 3,
                requiredApprovalsTopUp: 3
            }
        })
    }

    return serializeSettings(settings)
}

/**
 * Update SACCO settings (admin only)
 */
export async function updateSaccoSettings(formData: FormData) {
    const session = await auth()

    // Check if user is admin
    if (!session?.user?.role || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error('Only admins can update SACCO settings')
    }

    const loanMultiplier = parseFloat(formData.get('loanMultiplier') as string) || 0
    const processingFeePercent = parseFloat(formData.get('processingFeePercent') as string) || 0
    const insuranceFeePercent = parseFloat(formData.get('insuranceFeePercent') as string) || 0
    const shareCapitalBoost = parseFloat(formData.get('shareCapitalBoost') as string) || 0
    const penaltyRate = parseFloat(formData.get('penaltyRate') as string) || 0
    const rescheduleFeePercent = parseFloat(formData.get('rescheduleFeePercent') as string) || 0
    const refinanceFeePercentage = parseFloat(formData.get('refinanceFeePercentage') as string) || 0
    const requiredApprovals = parseInt(formData.get('requiredApprovals') as string) || 3
    const requiredApprovalsReschedule = parseInt(formData.get('requiredApprovalsReschedule') as string) || 3
    const requiredApprovalsTopUp = parseInt(formData.get('requiredApprovalsTopUp') as string) || 3

    // Welfare Settings
    const requiredWelfareApprovals = parseInt(formData.get('requiredWelfareApprovals') as string) || 3
    const welfareMonthlyContribution = parseFloat(formData.get('welfareMonthlyContribution') as string) || 0
    const welfareCurrentBalance = parseFloat(formData.get('welfareCurrentBalance') as string) || 0

    // Contribution Settings
    const monthlyContributionAmount = parseFloat(formData.get('monthlyContributionAmount') as string) || 2000
    const latePaymentPenalty = parseFloat(formData.get('latePaymentPenalty') as string) || 200

    // Validate inputs
    if (loanMultiplier < 0 || processingFeePercent < 0 || insuranceFeePercent < 0 || shareCapitalBoost < 0 || penaltyRate < 0 || rescheduleFeePercent < 0 || refinanceFeePercentage < 0 || welfareMonthlyContribution < 0 || welfareCurrentBalance < 0 || monthlyContributionAmount < 1 || latePaymentPenalty < 0) {
        throw new Error('All values must be non-negative, and monthly contribution must be at least 1')
    }

    if (requiredApprovals < 1 || requiredApprovals > 10 || requiredApprovalsReschedule < 1 || requiredApprovalsReschedule > 10 || requiredWelfareApprovals < 1 || requiredWelfareApprovals > 10) {
        throw new Error('Required approvals must be between 1 and 10')
    }

    // Get or create settings
    let settings = await prisma.saccoSettings.findFirst()

    if (settings) {
        settings = await prisma.saccoSettings.update({
            where: { id: settings.id },
            data: {
                loanMultiplier,
                processingFeePercent,
                insuranceFeePercent,
                shareCapitalBoost,
                penaltyRate,
                rescheduleFeePercent,
                refinanceFeePercentage,
                requiredApprovals,
                requiredApprovalsReschedule,
                requiredApprovalsTopUp,
                requiredWelfareApprovals,
                welfareMonthlyContribution,
                welfareCurrentBalance,
                monthlyContributionAmount,
                latePaymentPenalty
            }
        })
    } else {
        settings = await prisma.saccoSettings.create({
            data: {
                loanMultiplier,
                processingFeePercent,
                insuranceFeePercent,
                shareCapitalBoost,
                penaltyRate,
                rescheduleFeePercent,
                refinanceFeePercentage,
                requiredApprovals,
                requiredApprovalsReschedule,
                requiredApprovalsTopUp,
                requiredWelfareApprovals,
                welfareMonthlyContribution,
                welfareCurrentBalance,
                monthlyContributionAmount,
                latePaymentPenalty
            }
        })
    }

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id!,
            action: 'SETTINGS_UPDATED',
            details: `Updated settings: Mult=${loanMultiplier}, Proc=${processingFeePercent}%, Ins=${insuranceFeePercent}%, Pen=${penaltyRate}%, Welfare=${welfareMonthlyContribution}/mo, WelfareBal=${welfareCurrentBalance}, Contribution=${monthlyContributionAmount}/mo, LatePenalty=${latePaymentPenalty}`
        }
    })

    // Helper to serialize Decimal to numbers
    const serializeSettings = (s: any) => ({
        ...s,
        loanMultiplier: Number(s.loanMultiplier),
        processingFeePercent: Number(s.processingFeePercent),
        insuranceFeePercent: Number(s.insuranceFeePercent),
        shareCapitalBoost: Number(s.shareCapitalBoost),
        penaltyRate: Number(s.penaltyRate),
        rescheduleFeePercent: Number(s.rescheduleFeePercent),
        refinanceFeePercentage: Number(s.refinanceFeePercentage),
        welfareMonthlyContribution: Number(s.welfareMonthlyContribution),
        welfareCurrentBalance: Number(s.welfareCurrentBalance),
        monthlyContributionAmount: Number(s.monthlyContributionAmount || 2000),
        latePaymentPenalty: Number(s.latePaymentPenalty || 200)
    })

    const serialized = serializeSettings(settings)

    revalidatePath('/admin/system')
    return serialized
}

// Helper for getSaccoSettings
function serializeSettings(s: any) {
    if (!s) return null
    return {
        ...s,
        loanMultiplier: Number(s.loanMultiplier),
        processingFeePercent: Number(s.processingFeePercent),
        insuranceFeePercent: Number(s.insuranceFeePercent),
        shareCapitalBoost: Number(s.shareCapitalBoost),
        penaltyRate: Number(s.penaltyRate),
        rescheduleFeePercent: Number(s.rescheduleFeePercent),
        refinanceFeePercentage: Number(s.refinanceFeePercentage),
        welfareMonthlyContribution: Number(s.welfareMonthlyContribution),
        welfareCurrentBalance: Number(s.welfareCurrentBalance),
        monthlyContributionAmount: Number(s.monthlyContributionAmount || 2000),
        latePaymentPenalty: Number(s.latePaymentPenalty || 200)
    }
}

/**
 * Calculate Loan Qualification
 * 
 * CRITICAL: Uses SHARE CAPITAL (member.shareContributions), NOT wallet balance
 * This enforces the core SACCO principle: loans are qualified by equity ownership
 * 
 * @param memberId - Member ID
 * @param loansToOffset - Optional array of loan IDs to offset/top-up (only these will be deducted)
 */
export async function calculateLoanQualification(memberId: string, loansToOffset: string[] = [], appliedAmount?: number, exemptions?: any) {
    // Import strict currency helpers
    const {
        truncateToDecimals,
        calculatePercentage,
        addMoney,
        subtractMoney,
        multiplyMoney,
        formatCurrency,
        decimalToNumber
    } = await import('@/lib/currency')

    // Import statement processor for accurate balance calculation
    const { processTransactions } = await import('@/lib/statementProcessor')

    const settings = await getSaccoSettings()

    console.log(`[calculateLoanQualification] Fetching member: ${memberId}`);
    // Get member with shares and existing loans
    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            loans: {
                where: {
                    status: { in: ['APPROVED', 'ACTIVE', 'OVERDUE'] }
                },
                include: {
                    transactions: true // Needed for accurate balance calculation
                }
            }
        }
    })

    if (!member) {
        throw new Error('Member not found')
    }

    // CRITICAL: Use shareContributions from GENERAL LEDGER (Account 3100)
    // AND Member Contributions (Account 1200) for multiplier base
    const { getMemberContributionBalance } = await import('@/lib/accounting/AccountingEngine')
    // NOTE: getMemberShareBalance was removed as it returns the same value as getMemberContributionBalance
    // Both use the CONTRIBUTIONS account, so using it twice was double-counting
    const memberContributions = truncateToDecimals(await getMemberContributionBalance(memberId))

    // Calculate gross qualifying amount (contributions × multiplier)
    // Using only memberContributions to avoid double-counting
    const grossQualifyingAmount = multiplyMoney(memberContributions, Number(settings.loanMultiplier))

    // CRITICAL: Only calculate fees if user has entered an applied amount
    // Do NOT fall back to grossQualifyingAmount - that's just their borrowing capacity
    const baseAmount = truncateToDecimals(appliedAmount || 0)

    console.log('[calculateLoanQualification] Debug:', {
        memberId,
        memberContributions,
        grossQualifyingAmount,
        appliedAmount,
        baseAmount,
        loansToOffset: loansToOffset.length,
        exemptions
    });

    // Calculate fees based on the applied amount (0 if not provided)
    // Check exemptions
    const exemptProcessing = exemptions?.processingFee === true || exemptions?.processingFee === 'true';
    const exemptInsurance = exemptions?.insuranceFee === true || exemptions?.insuranceFee === 'true';

    const processingFee = exemptProcessing ? 0 : calculatePercentage(baseAmount, Number(settings.processingFeePercent))
    const insuranceFee = exemptInsurance ? 0 : calculatePercentage(baseAmount, Number(settings.insuranceFeePercent))
    const shareCapitalDeduction = truncateToDecimals(Number(settings.shareCapitalBoost) || 0)

    // Cast member to any to access duplicate loans property
    const memberWithLoans = member as any;

    // Calculate loan offset - ONLY for explicitly selected loans
    let selectedLoansOffset = 0;
    if (loansToOffset.length > 0) {
        // Fetch selected loans directly by ID (don't rely on member.loans filter)
        const selectedLoans = await prisma.loan.findMany({
            where: {
                id: { in: loansToOffset },
                memberId: memberId  // Security: ensure loans belong to this member
            },
            include: {
                transactions: true // Critical for accurate balance
            }
        });

        console.log('[calculateLoanQualification] Selected loans for offset:', selectedLoans.length);

        // Calculate total offset amount (full clearance of each loan)
        for (const loan of selectedLoans) {
            // Use statement processor logic for accurate buffer-free calculation
            const rawTransactions = loan.transactions ? loan.transactions.map((tx: any) => ({
                ...tx,
                amount: Number(tx.amount),
                createdAt: tx.postedAt,
                type: tx.type
            })) : [];

            const mappedTransactions = rawTransactions.map((tx: any) => ({
                ...tx,
                type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                    tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                        tx.type
            }));

            const statementRows = processTransactions(mappedTransactions as any[]);
            const statementBalance = statementRows.length > 0
                ? statementRows[statementRows.length - 1].runningBalance
                : 0;

            const outstandingBalance = truncateToDecimals(statementBalance);

            if (outstandingBalance > 0) {
                selectedLoansOffset = addMoney(selectedLoansOffset, outstandingBalance);
                console.log(`[calculateLoanQualification] Loan ${loan.loanApplicationNumber}: Outstanding Balance = ${outstandingBalance}`);
            } else {
                // Fallback: use net disbursement or original loan amount if balance is 0
                const fallbackAmount = truncateToDecimals(Number(loan.netDisbursementAmount || loan.amount || 0));
                selectedLoansOffset = addMoney(selectedLoansOffset, fallbackAmount);
                console.log(`[calculateLoanQualification] Loan ${loan.loanApplicationNumber}: Using fallback amount = ${fallbackAmount} (stored balance was 0)`);
            }
        }
    }

    // Top-up fee: Calculated as percentage of OFFSET AMOUNT (loans being paid off), not applied amount
    const topUpFee = (selectedLoansOffset > 0)
        ? calculatePercentage(selectedLoansOffset, Number(settings.refinanceFeePercentage))
        : 0

    console.log('[calculateLoanQualification] Fees:', {
        processingFee,
        insuranceFee,
        shareCapitalDeduction,
        topUpFee,
        selectedLoansOffset,
        topUpFeeCalculatedOn: 'offset amount',
        hasOffsets: loansToOffset.length > 0
    });

    // Total exposure across ALL active loans
    let totalExposure = 0;
    for (const loan of memberWithLoans.loans) {
        try {
            // Re-calculate balance using statement logic if possible, or fallback manually
            const rawTransactions = (loan as any).transactions ? (loan as any).transactions.map((tx: any) => ({
                ...tx,
                amount: Number(tx.amount),
                createdAt: tx.postedAt,
                type: tx.type
            })) : [];

            if (rawTransactions.length > 0) {
                const mappedTransactions = rawTransactions.map((tx: any) => ({
                    ...tx,
                    type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                        tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                            tx.type
                }));
                const rows = processTransactions(mappedTransactions);
                const bal = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
                totalExposure = addMoney(totalExposure, bal);
            } else {
                // Try Accounting Engine fallback
                const { getLoanOutstandingBalance } = await import('@/lib/accounting/AccountingEngine');
                const bal = await getLoanOutstandingBalance(loan.id);
                totalExposure = addMoney(totalExposure, bal);
            }
        } catch (error) {
            const fallback = truncateToDecimals(Number(loan.netDisbursementAmount || loan.amount));
            totalExposure = addMoney(totalExposure, fallback);
        }
    }

    // Calculate deductions (fees only - NOT including loan offsets)
    const feeDeductions = addMoney(addMoney(addMoney(processingFee, insuranceFee), shareCapitalDeduction), topUpFee)

    // Total deductions includes both fees AND loan offsets
    const totalDeductions = addMoney(feeDeductions, selectedLoansOffset)

    // Net disbursement amount calculation:
    // Use the SAME baseAmount we used for fee calculations
    // Subtract all deductions (fees + offsets)
    const netDisbursementAmount = Math.max(0, subtractMoney(baseAmount, totalDeductions))

    console.log('[calculateLoanQualification] Final calculation:', {
        baseAmount,
        processingFee,
        insuranceFee,
        shareCapitalDeduction,
        topUpFee,
        selectedLoansOffset,
        totalDeductions,
        netDisbursementAmount
    });

    return {
        memberShares: memberContributions,
        grossQualifyingAmount: grossQualifyingAmount,
        totalExposure: totalExposure,
        processingFee: processingFee,
        insuranceFee: insuranceFee,
        shareCapitalDeduction: shareCapitalDeduction,
        topUpFee: topUpFee,
        selectedLoansOffset: selectedLoansOffset,
        totalDeductions: totalDeductions,
        netDisbursementAmount: netDisbursementAmount,
        loanMultiplier: truncateToDecimals(Number(settings.loanMultiplier))
    }
}

/**
 * Get member's active loans with outstanding balances
 * Used for loan offset selection in application form
 */
export async function getMemberActiveLoans(memberId: string) {
    console.log('[getMemberActiveLoans] Fetching for member:', memberId);
    try {
        // Import statement processor for consistent balance calculation (same as Loans tab)
        const { processTransactions } = await import('@/lib/statementProcessor')

        const loans = await prisma.loan.findMany({
            where: {
                memberId,
                status: { in: ['APPROVED', 'DISBURSED', 'ACTIVE', 'OVERDUE'] }
            },
            include: {
                loanProduct: {
                    select: { name: true }
                },
                transactions: true // Fetch LoanTransaction records for statement processing
            },
            orderBy: { disbursementDate: 'desc' }
        })

        console.log(`[getMemberActiveLoans] Found ${loans.length} active loans`);

        // Calculate balances using the SAME logic as the Loans tab
        const loansWithBalances = loans.map((loanItem: any) => {
            const loan = loanItem;

            try {
                // Map LoanTransaction to structure expected by processTransactions
                const rawTransactions = loan.transactions ? loan.transactions.map((tx: any) => ({
                    ...tx,
                    amount: Number(tx.amount),
                    createdAt: tx.postedAt,
                    type: tx.type
                })) : [];

                // Map transaction types to match statement processor expectations
                const mappedTransactions = rawTransactions.map((tx: any) => ({
                    ...tx,
                    type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                        tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                            tx.type
                }));

                // Process transactions to get running balance (same as Loans tab)
                const statementRows = processTransactions(mappedTransactions as any[]);
                const statementBalance = statementRows.length > 0
                    ? statementRows[statementRows.length - 1].runningBalance
                    : 0;

                return {
                    id: loan.id,
                    loanApplicationNumber: loan.loanApplicationNumber,
                    productName: loan.loanProduct?.name || 'Loan',
                    disbursedAmount: Number(loan.netDisbursementAmount || loan.amount),
                    outstandingBalance: statementBalance, // Use statement balance (same as Loans tab)
                    status: loan.status,
                    // Add missing fields required by frontend interface
                    disbursementDate: loan.disbursementDate || loan.applicationDate, // Fallback to application date
                    interestRate: Number(loan.interestRate || loan.loanProduct?.interestRate || 0),
                    penalties: 0 // Default to 0 as we don't have separate penalty tracking yet
                }
            } catch (err) {
                console.error(`[getMemberActiveLoans] Error processing loan ${loan.id}:`, err);
                // Return safe fallback
                return {
                    id: loan.id,
                    loanApplicationNumber: loan.loanApplicationNumber,
                    productName: loan.loanProduct?.name || 'Loan',
                    disbursedAmount: Number(loan.netDisbursementAmount || loan.amount),
                    outstandingBalance: Number(loan.netDisbursementAmount || loan.amount), // Fallback balance
                    status: loan.status,
                    disbursementDate: loan.disbursementDate || loan.applicationDate,
                    interestRate: 0,
                    penalties: 0
                };
            }
        })

        return loansWithBalances
    } catch (e) {
        console.error('[getMemberActiveLoans] FAILED:', e);
        throw e;
    }
}
