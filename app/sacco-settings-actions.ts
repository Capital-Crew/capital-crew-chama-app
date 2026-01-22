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
    if (loanMultiplier < 0 || processingFeePercent < 0 || insuranceFeePercent < 0 || shareCapitalBoost < 0 || penaltyRate < 0 || rescheduleFeePercent < 0 || refinanceFeePercentage < 0 || welfareMonthlyContribution < 0 || welfareCurrentBalance < 0 || monthlyContributionAmount < 0 || latePaymentPenalty < 0) {
        throw new Error('All values must be non-negative')
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
export async function calculateLoanQualification(memberId: string, loansToOffset: string[] = [], appliedAmount?: number) {
    const settings = await getSaccoSettings()

    console.log(`[calculateLoanQualification] Fetching member: ${memberId}`);
    // Get member with shares and existing loans
    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            loans: {
                where: {
                    status: { in: ['ACTIVE', 'OVERDUE'] }
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
    const memberContributions = await getMemberContributionBalance(memberId)

    // Calculate gross qualifying amount (contributions × multiplier)
    // Using only memberContributions to avoid double-counting
    const grossQualifyingAmount = memberContributions * Number(settings.loanMultiplier)

    // CRITICAL: Only calculate fees if user has entered an applied amount
    // Do NOT fall back to grossQualifyingAmount - that's just their borrowing capacity
    const baseAmount = appliedAmount || 0

    console.log('[calculateLoanQualification] Debug:', {
        memberId,
        memberContributions,
        grossQualifyingAmount,
        appliedAmount,
        baseAmount,
        loansToOffset: loansToOffset.length
    });

    // Calculate fees based on the applied amount (0 if not provided)
    const processingFee = (baseAmount * Number(settings.processingFeePercent)) / 100
    const insuranceFee = (baseAmount * Number(settings.insuranceFeePercent)) / 100
    const shareCapitalDeduction = Number(settings.shareCapitalBoost) || 0

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
            }
        });

        console.log('[calculateLoanQualification] Selected loans for offset:', selectedLoans.length);
        console.log('[calculateLoanQualification] Loan IDs requested:', loansToOffset);
        console.log('[calculateLoanQualification] Loan IDs found:', selectedLoans.map((l: any) => l.id));

        // Calculate total offset amount (full clearance of each loan)
        for (const loan of selectedLoans) {
            // Use outstandingBalance if available, otherwise calculate from ledger
            const outstandingBalance = Number(loan.outstandingBalance || loan.current_balance || 0);

            if (outstandingBalance > 0) {
                selectedLoansOffset += outstandingBalance;
                console.log(`[calculateLoanQualification] Loan ${loan.loanApplicationNumber}: Outstanding Balance = ${outstandingBalance}`);
            } else {
                // Fallback: use net disbursement or original loan amount if balance is 0
                const fallbackAmount = Number(loan.netDisbursementAmount || loan.amount || 0);
                selectedLoansOffset += fallbackAmount;
                console.log(`[calculateLoanQualification] Loan ${loan.loanApplicationNumber}: Using fallback amount = ${fallbackAmount} (stored balance was 0)`);
            }
        }
    }

    // Top-up fee: Calculated as percentage of OFFSET AMOUNT (loans being paid off), not applied amount
    const topUpFee = (selectedLoansOffset > 0)
        ? (selectedLoansOffset * (Number(settings.refinanceFeePercentage) || 0)) / 100
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
            const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance } = await import('@/lib/accounting/AccountingEngine');
            const principal = await getLoanPrincipalBalance(loan.id);
            const interest = await getLoanInterestBalance(loan.id);
            const penalty = await getLoanPenaltyBalance(loan.id);
            totalExposure += (principal + interest + penalty);
        } catch (error) {
            totalExposure += (loan.netDisbursementAmount || loan.amount);
        }
    }

    // Calculate deductions (fees only - NOT including loan offsets)
    const feeDeductions = processingFee + insuranceFee + Number(shareCapitalDeduction) + topUpFee

    // Total deductions includes both fees AND loan offsets
    const totalDeductions = feeDeductions + selectedLoansOffset

    // Net disbursement amount calculation:
    // Use the SAME baseAmount we used for fee calculations
    // Subtract all deductions (fees + offsets)
    const netDisbursementAmount = Math.max(0, baseAmount - totalDeductions)

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
        memberShares: Number(memberContributions),  // Convert to number
        grossQualifyingAmount: Number(grossQualifyingAmount),
        totalExposure: Number(totalExposure),
        processingFee: Number(processingFee),
        insuranceFee: Number(insuranceFee),
        shareCapitalDeduction: Number(shareCapitalDeduction),
        topUpFee: Number(topUpFee),
        selectedLoansOffset: Number(selectedLoansOffset),
        totalDeductions: Number(totalDeductions),
        netDisbursementAmount: Number(netDisbursementAmount),
        loanMultiplier: Number(settings.loanMultiplier)
    }
}

/**
 * Get member's active loans with outstanding balances
 * Used for loan offset selection in application form
 */
export async function getMemberActiveLoans(memberId: string) {
    const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance } = await import('@/lib/accounting/AccountingEngine')

    const loans = await prisma.loan.findMany({
        where: {
            memberId,
            status: { in: ['ACTIVE', 'OVERDUE'] }
        },
        include: {
            loanProduct: {
                select: { name: true }
            }
        },
        orderBy: { disbursementDate: 'desc' }
    })

    // Get outstanding balances for each loan
    const loansWithBalances = await Promise.all(
        loans.map(async (loanItem: any) => {
            const loan = loanItem;
            let penalty = 0
            let interest = 0
            let principal = 0

            try {
                penalty = await getLoanPenaltyBalance(loan.id)
                interest = await getLoanInterestBalance(loan.id)
                principal = await getLoanPrincipalBalance(loan.id)
            } catch (error) {
                // If accounts not seeded, use loan amount
                principal = Number(loan.amount)
            }

            const outstanding = penalty + interest + principal

            return {
                id: loan.id,
                loanApplicationNumber: loan.loanApplicationNumber,
                productName: loan.loanProduct?.name || 'Loan',
                disbursedAmount: Number(loan.netDisbursementAmount || loan.amount),
                outstandingBalance: outstanding,
                status: loan.status
            }
        })
    )

    return loansWithBalances
}
