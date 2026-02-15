'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { LoanStatus, ApprovalStatus, LoanEventType, NotificationType, AuditLogAction, SystemAccountType, UserRole } from '@prisma/client'
import { LoanBalanceService } from '@/services/loan-balance';
import { getSystemMappingsDict } from './actions/system-accounting'
import { getSaccoSettings } from './sacco-settings-actions'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { WalletService } from '@/lib/services/WalletService'
import { LoanService } from '@/services/loan-service'

// Use global db instance
const prisma = db

/**
 * Toggle Concurrent Application Exemption
 * Allows a member to apply for another loan even if this one is pending/approved.
 */
export async function toggleConcurrentExemption(loanId: string, allowed: boolean) {
    const session = await auth()
    // @ts-ignore
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Check admin permissions
    const userRole = session.user.role
    const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMINISTRATOR'].includes(userRole)

    // Also check granular permissions if needed, but for now strict admin
    if (!isAdmin) throw new Error("Only admins can toggle exemptions")

    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) throw new Error("Loan not found")

    const currentExemptions = (loan.feeExemptions as any) || {}

    await prisma.loan.update({
        where: { id: loanId },
        data: {
            feeExemptions: {
                ...currentExemptions,
                allowConcurrentApplication: allowed
            }
        }
    })

    revalidatePath('/loans')
    return { success: true }
}

/**
 * Submit a loan approval vote
 */
export async function submitLoanApproval(loanId: string, decision: 'APPROVED' | 'REJECTED', notes: string) {
    const session = await auth()
    console.log('submitLoanApproval - Session:', JSON.stringify(session, null, 2))

    // @ts-ignore
    if (!session?.user?.memberId) {
        return { error: "Unauthorized: You must be a member to approve loans" }
    }

    // @ts-ignore
    const approverId = session.user.memberId

    // PERMISSION CHECK:
    // User must have 'APPROVE_LOANS' permission via Role OR Granular Permissions
    const userRole = session.user.role
    // @ts-ignore
    const userPermissions = session.user.permissions

    const roleHasPermission = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SYSTEM_ADMINISTRATOR'].includes(userRole) // Quick check aligned with approval-actions

    let hasGranularPermission = false
    if (userPermissions) {
        if (Array.isArray(userPermissions)) {
            hasGranularPermission = userPermissions.includes('APPROVE_LOANS') || userPermissions.includes('ALL')
        } else if (typeof userPermissions === 'object') {
            // @ts-ignore
            hasGranularPermission =
                userPermissions['APPROVE_LOANS'] === true ||
                userPermissions['canApprove'] === true || // Added mapped key
                userPermissions['ALL'] === true
        }
    }

    if (!roleHasPermission && !hasGranularPermission) {
        // CHECK FOR DELEGATED AUTHORITY
        // If user lacks direct permission, check if they have a valid delegation from an authorized approver
        const activeDelegations = await prisma.approvalDelegation.findMany({
            where: {
                toUserId: session.user.id,
                revokedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ],
                AND: [
                    {
                        OR: [
                            { entityType: null },
                            { entityType: 'LOAN' }
                        ]
                    },
                    {
                        OR: [
                            { entityId: null },
                            { entityId: loanId }
                        ]
                    }
                ]
            },
            include: {
                fromUser: true
            }
        })

        // Check if any of the delegators have permission
        const hasValidDelegation = activeDelegations.some(d => {
            const delegatorRole = d.fromUser.role
            // Check if delegator is an authorized approver
            return ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SYSTEM_ADMINISTRATOR'].includes(delegatorRole)
            // Note: We could also check granular permissions of delegator here if needed
        })

        if (!hasValidDelegation) {
            return { error: "Unauthorized: You do not have permission (direct or delegated) to approve loans" }
        }
    }

    // 1. Transaction to record vote and check quorum
    const result = await prisma.$transaction(async (tx) => {
        // MAKER-CHECKER VALIDATION: Prevent self-approval
        const loan = await tx.loan.findUnique({
            where: { id: loanId },
            select: { memberId: true, loanApplicationNumber: true }
        })

        if (!loan) throw new Error("Loan not found")

        if (loan.memberId === approverId) {
            return { error: "Compliance Error: You cannot approve your own loan application" }
        }

        // Check if user has already voted
        const existingVote = await tx.loanApproval.findFirst({
            where: {
                loanId,
                approverId
            }
        })

        if (existingVote) {
            return { error: "You have already voted on this loan" }
        }

        // Record the vote
        await tx.loanApproval.create({
            data: {
                loanId,
                approverId,
                decision: decision === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
                notes
            }
        })

        // Audit Log
        await tx.auditLog.create({
            data: {
                userId: session.user.id!,
                action: AuditLogAction.LOAN_VOTE_CAST,
                details: `Voted ${decision} on Loan ${loanId}`
            }
        })

        // Check if we need to transition loan status
        // Get strict count of approvals with User Roles
        const loanWithApprovals = await tx.loan.findUnique({
            where: { id: loanId },
            include: {
                approvals: {
                    include: {
                        approver: {
                            include: { user: true }
                        }
                    }
                },
                loanProduct: true
            }
        })

        if (!loanWithApprovals) throw new Error("Loan not found")

        // Reject immediately if rejected
        if (decision === 'REJECTED') {
            await tx.loan.update({
                where: { id: loanId },
                data: { status: 'REJECTED' }
            })
            // Create Journey Event
            await tx.loanJourneyEvent.create({
                data: {
                    loanId,
                    eventType: LoanEventType.APPROVAL_REJECTED,
                    description: `Loan rejected by approver ${approverId}`,
                    actorId: approverId
                }
            })

            // Sync Approval Request
            await tx.approvalRequest.updateMany({
                where: { referenceId: loanId, type: 'LOAN' },
                data: {
                    status: 'REJECTED',
                    approverId: session.user.id,
                    approverName: session.user.name,
                    decisionNotes: notes,
                    approvedAt: new Date()
                }
            })

            return { status: 'REJECTED', message: 'Loan Rejected' }
        }

        // Count APPROVED votes
        // @ts-ignore
        const approvedVotes = loanWithApprovals.approvals.filter((a: any) => a.decision === 'APPROVED')
        const approvedCount = approvedVotes.length

        // Governance Check: Quality (Executive Role)
        const EXECUTIVE_ROLES: any[] = [UserRole.CHAIRPERSON, UserRole.SECRETARY, UserRole.TREASURER, UserRole.SYSTEM_ADMIN, 'SYSTEM_ADMINISTRATOR']

        const hasExecutiveApproval = approvedVotes.some((vote: any) => {
            const userRole = vote.approver?.user?.role
            return userRole && EXECUTIVE_ROLES.includes(userRole)
        })

        // Get required approvals (Global setting or Product specific)
        const settings = await tx.saccoSettings.findFirst()
        const requiredApprovals = settings?.requiredApprovals ?? 3

        // Condition: Quantity AND Quality met
        if (approvedCount >= requiredApprovals && hasExecutiveApproval) {
            // Transition to APPROVED/AWAITING_DISBURSEMENT
            // Use Enum here
            await tx.loan.update({
                where: { id: loanId },
                data: { status: LoanStatus.APPROVED }
            })

            await tx.loanJourneyEvent.create({
                data: {
                    loanId,
                    eventType: LoanEventType.LOAN_APPROVED,
                    description: `Loan fully approved by ${approvedCount} members (Including Executive)`,
                    actorId: 'SYSTEM'
                }
            })

            // Notification
            await tx.notification.create({
                data: {
                    memberId: loan.memberId,
                    type: NotificationType.LOAN_APPROVED,
                    message: `Your loan ${loan.loanApplicationNumber} has been approved and is ready for disbursement.`
                }
            })

            // Sync Approval Request
            await tx.approvalRequest.updateMany({
                where: { referenceId: loanId, type: 'LOAN' },
                data: {
                    status: 'APPROVED',
                    approverId: session.user.id,
                    approverName: session.user.name,
                    decisionNotes: notes,
                    approvedAt: new Date()
                }
            })

            return { status: 'APPROVED', message: 'Loan Approved Successfully' }
        } else if (approvedCount >= requiredApprovals && !hasExecutiveApproval) {
            // Quantity met, Quality failed
            return { status: 'PENDING_EXECUTIVE', message: 'Quorum met, waiting for Executive Approval' }
        }

        return { status: 'PENDING_QUORUM', message: `Vote recorded. (${approvedCount}/${requiredApprovals})` }
    })

    if (result && 'error' in result) {
        return result
    }

    revalidatePath(`/loans/${loanId}`)
    revalidatePath('/dashboard')

    return result || { success: true }
}

/**
 * Reject a loan application specifically
 */
export async function rejectLoan(loanId: string, reason: string) {
    return submitLoanApproval(loanId, 'REJECTED', reason);
}

/**
 * Approve a loan application specifically
 */
export async function approveLoan(loanId: string, notes: string = 'Approved via dashboard') {
    return submitLoanApproval(loanId, 'APPROVED', notes);
}


/**
 * Disburse Loan (Wallet Integration)
 * Using the AccountingEngine for strict double-entry
 */
import { withAudit } from '@/lib/with-audit';
import { AuditContext } from '@/lib/audit-context';

export async function disburseLoanToWallet(loanId: string) {
    return withAudit(
        AuditLogAction.LOAN_DISBURSED,
        async (_: string) => {  // _ because we use the outer loanId, or keep it as loanId but it shadows
            const session = await auth()
            if (!session?.user) {
                throw new Error('Unauthorized: Authentication required')
            }

            // Check authorization: Role-based OR Permission-based
            const userRole = session.user.role
            const hasRolePermission = ['TREASURER', 'CHAIRPERSON', 'SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(userRole)

            // @ts-ignore - Check granular permissions
            const userPermissions = session.user.permissions
            let hasGranularPermission = false

            if (userPermissions) {
                if (Array.isArray(userPermissions)) {
                    hasGranularPermission = userPermissions.includes('DISBURSE_LOANS') || userPermissions.includes('ALL')
                } else if (typeof userPermissions === 'object') {
                    // @ts-ignore
                    hasGranularPermission =
                        userPermissions['DISBURSE_LOANS'] === true ||
                        userPermissions['canDisburse'] === true ||
                        userPermissions['ALL'] === true
                }
            }

            if (!hasRolePermission && !hasGranularPermission) {
                throw new Error('Unauthorized: You do not have permission to disburse loans. Required permission: DISBURSE_LOANS')
            }

            AuditContext.track('Permission Checked', { userId: session.user.id, role: userRole });

            return await prisma.$transaction(async (tx) => {
                const loan = await tx.loan.findUnique({
                    where: { id: loanId },
                    include: {
                        member: {
                            include: { wallet: true }
                        },
                        loanProduct: {
                            include: { accountingMappings: true }
                        },
                        topUps: true // Include offsets
                    }
                })

                if (!loan) throw new Error("Loan not found")
                if (loan.status !== 'APPROVED') {
                    throw new Error(`Loan cannot be disbursed. Current status: ${loan.status}. Only APPROVED loans can be disbursed.`)
                }

                // Check if loan has already been disbursed
                const existingBalance = Number(loan.outstandingBalance)
                if (existingBalance > 0) {
                    throw new Error(
                        `Loan has already been disbursed. Outstanding balance: KES ${existingBalance.toLocaleString()}. ` +
                        `Disbursement date: ${loan.disbursementDate?.toLocaleDateString() || 'Unknown'}`
                    )
                }

                AuditContext.track('Loan Validated', { loanId, amount: loan.amount });

                // 1. Calculate Amounts
                const principal = Number(loan.amount)

                // Deductions
                const processingFee = Number(loan.processingFee)
                const insuranceFee = Number(loan.insuranceFee)
                const shareDeduction = Number(loan.shareCapitalDeduction)

                // Offsets (Top-ups) - Includes Principal + Interest + Penalties + Refinance Fee
                const totalOffset = loan.topUps.reduce((sum, t) => sum + Number(t.totalOffset), 0)

                // Net
                const netDisbursement = principal - processingFee - insuranceFee - shareDeduction - totalOffset

                if (netDisbursement <= 0) {
                    throw new Error(
                        `Cannot disburse loan: Net disbursement is ${netDisbursement < 0 ? 'negative' : 'zero'} (KES ${netDisbursement.toFixed(2)}). ` +
                        `Principal: ${principal}, Fees: ${processingFee + insuranceFee}, Share Deduction: ${shareDeduction}, Offsets: ${totalOffset}. ` +
                        `Please adjust the loan amount or deductions.`
                    )
                }

                AuditContext.track('Amounts Calculated', {
                    principal,
                    processingFee,
                    insuranceFee,
                    shareDeduction,
                    totalOffset,
                    netDisbursement
                });

                // 2. Resolve Member Wallet (Unique Liability Account)
                // This ensures every member has a distinct Ledger Account for their wallet
                // If wallet doesn't exist, it creates one (Code: WAL-XXXXXX)
                const memberWallet = await WalletService.createWallet(loan.memberId, tx)
                const memberWalletAccountId = memberWallet.glAccountId

                // 3. Perform Accounting (General Ledger) via AccountingEngine
                // Fetch dynamic mappings
                const mappings = await getSystemMappingsDict()
                const { DEFAULT_MAPPINGS } = await import('@/lib/accounting/constants') // Allow fallback

                const fundingAccountCode = mappings['EVENT_LOAN_DISBURSEMENT'] || DEFAULT_MAPPINGS['EVENT_LOAN_DISBURSEMENT']

                if (!fundingAccountCode) {
                    throw new Error("System Mapping for 'EVENT_LOAN_DISBURSEMENT' is missing.")
                }

                const getCode = (type: SystemAccountType) => mappings[type] || DEFAULT_MAPPINGS[type]

                // OVERDRAFT PROTECTION: Check if Funding Source (Loan Disbursement Account) has sufficient balance
                const { BalanceChecker } = await import('@/lib/accounting/BalanceChecker')
                // const disbursementAccountBalance = await BalanceChecker.getAccountBalance(fundingAccountCode, tx)

                // REMOVED: The Loan Portfolio (1100/1200) receives the DEBIT (Asset Increase).
                // Checking if it has "sufficient funds" implies it's a Source (Credit), which is incorrect.
                // Since we are crediting Member Wallet (Liability), we are effectively expanding the balance sheet.
                // Cash checks should happen at Withdrawal, not Disbursement to Wallet.

                /*
                if (disbursementAccountBalance < netDisbursement) {
                    throw new Error(
                        `Insufficient funds in ${fundingAccountCode} (Disbursement Account). ` +
                        `Required: KES ${netDisbursement.toLocaleString()}, ` +
                        `Available: KES ${disbursementAccountBalance.toLocaleString()}. ` +
                        `Please credit the Loan Portfolio with opening capital.`
                    )
                }
                */

                // Build Journal Lines
                let lineIndex = 0

                // 1. Round ALL components first
                const roundedPrincipal = Number(Number(principal).toFixed(2))
                const roundedProcessingFee = Number(Number(processingFee).toFixed(2))
                const roundedInsuranceFee = Number(Number(insuranceFee).toFixed(2))
                const roundedShareDeduction = Number(Number(shareDeduction).toFixed(2))

                // 2. Round Offsets
                let roundedTotalOffsets = 0
                const roundedOffsetLines: any[] = []

                for (const topUp of loan.topUps) {
                    const clearanceAmount = Number(topUp.totalOffset) - Number(topUp.refinanceFee || 0);
                    const roundedClearance = Number(Number(clearanceAmount).toFixed(2))
                    const roundedRefinanceFee = Number(Number(topUp.refinanceFee || 0).toFixed(2))

                    roundedTotalOffsets += roundedClearance + roundedRefinanceFee

                    // Reconstruct lines for Offset
                    if (roundedClearance > 0) {
                        roundedOffsetLines.push({
                            accountId: (await getAccountId(tx, getCode('RECEIVABLES'))),
                            accountType: 'ASSET',
                            description: `Offset Clearance - ${topUp.oldLoanNumber}`,
                            debitAmount: 0,
                            creditAmount: roundedClearance,
                            index: lineIndex++
                        })
                    }
                    if (roundedRefinanceFee > 0) {
                        roundedOffsetLines.push({
                            accountId: (await getAccountId(tx, getCode('INCOME_REFINANCE_FEE'))),
                            accountType: 'INCOME',
                            description: `Refinance Fee - ${topUp.oldLoanNumber}`,
                            debitAmount: 0,
                            creditAmount: roundedRefinanceFee,
                            index: lineIndex++
                        })
                    }
                }

                // 3. Calculate Deductions Sum
                const totalDeductions = roundedProcessingFee + roundedInsuranceFee + roundedShareDeduction + roundedTotalOffsets

                // 4. DERIVE Net Disbursement to ensure Balance
                // Principal (Debit) = Net (Credit) + Deductions (Credit)
                // Therefore: Net = Principal - Deductions
                const derivedNetDisbursement = Number((roundedPrincipal - totalDeductions).toFixed(2))

                if (derivedNetDisbursement < 0) {
                    throw new Error(`Rounding Error: Net disbursement calculated as negative (KES ${derivedNetDisbursement}). Please check deductions.`)
                }

                // 5. Rebuild Journal Lines with ROUNDED values
                const finalJournalLines: any[] = []
                let idx = 0

                // DEBIT: Principal
                finalJournalLines.push({
                    accountId: (await getAccountId(tx, fundingAccountCode)),
                    accountType: 'ASSET',
                    description: `Principal Disbursement - ${loan.loanApplicationNumber}`,
                    debitAmount: roundedPrincipal,
                    creditAmount: 0,
                    index: idx++
                })

                // CREDIT: Net Disbursement
                if (derivedNetDisbursement > 0) {
                    finalJournalLines.push({
                        accountId: memberWalletAccountId,
                        accountType: 'LIABILITY',
                        description: `Net Disbursement to Wallet`,
                        debitAmount: 0,
                        creditAmount: derivedNetDisbursement,
                        index: idx++
                    })
                }

                // CREDIT: Fees & Deductions
                if (roundedProcessingFee > 0) {
                    finalJournalLines.push({
                        accountId: (await getAccountId(tx, getCode('INCOME_LOAN_PROCESSING_FEE'))),
                        accountType: 'INCOME',
                        description: 'Processing Fee',
                        debitAmount: 0,
                        creditAmount: roundedProcessingFee,
                        index: idx++
                    })
                }
                if (roundedInsuranceFee > 0) {
                    finalJournalLines.push({
                        accountId: (await getAccountId(tx, getCode('INCOME_GENERAL_FEE'))),
                        accountType: 'INCOME',
                        description: 'Insurance Fee',
                        debitAmount: 0,
                        creditAmount: roundedInsuranceFee,
                        index: idx++
                    })
                }
                if (roundedShareDeduction > 0) {
                    finalJournalLines.push({
                        accountId: (await getAccountId(tx, getCode('CONTRIBUTIONS'))),
                        accountType: 'ASSET',
                        description: 'Contribution Deduction',
                        debitAmount: 0,
                        creditAmount: roundedShareDeduction,
                        index: idx++
                    })
                }

                // CREDIT: Offsets
                roundedOffsetLines.forEach(l => {
                    finalJournalLines.push({ ...l, index: idx++ })
                })

                const je = await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'LOAN_DISBURSEMENT',
                    referenceId: loan.id,
                    description: `Disbursement for Loan ${loan.loanApplicationNumber}`,
                    createdBy: session!.user.id!,
                    createdByName: session!.user.name || 'Unknown',
                    lines: finalJournalLines
                }, tx)

                AuditContext.track('Journal Entry Posted', { jeId: je.id, totalAmount: roundedPrincipal });

                // 2b. Strict Loan Ledger Transaction (New Loan - DEBIT)
                await tx.loanTransaction.create({
                    data: {
                        loanId: loan.id,
                        type: 'DISBURSEMENT',
                        amount: new Prisma.Decimal(principal),
                        description: `Disbursement (Ref: ${je.entryNumber})`,
                        referenceId: je.id,
                        postedAt: new Date(),
                        transactionDate: new Date()
                    }
                });

                AuditContext.track('Loan Ledger Updated');

                // 2c. Force Balance Update (New Loan)
                const strictBalance = await LoanBalanceService.updateLoanBalance(loanId, tx);

                // 2d. Process Offsets (Old Loans - REPAYMENT)
                for (const topUp of loan.topUps) {
                    // Calculate actual debt clearance (Total Offset - Refinance Fee)
                    const clearanceAmount = new Prisma.Decimal(topUp.totalOffset).sub(new Prisma.Decimal(topUp.refinanceFee || 0));

                    // Create Repayment Transaction for old loan (ONLY for the debt amount)
                    await tx.loanTransaction.create({
                        data: {
                            loanId: topUp.oldLoanId,
                            type: 'REPAYMENT',
                            amount: clearanceAmount,
                            description: `Offset by New Loan ${loan.loanApplicationNumber}`,
                            referenceId: je.id,
                            postedAt: new Date(),
                            transactionDate: new Date()
                        }
                    })

                    // Update Old Loan Balance
                    const oldLoanBalance = await LoanBalanceService.updateLoanBalance(topUp.oldLoanId, tx)

                    // Check if cleared
                    if (oldLoanBalance.lte(0)) {
                        await tx.loan.update({
                            where: { id: topUp.oldLoanId },
                            data: {
                                status: 'CLEARED',
                                // Mark cleared journey event
                            }
                        })
                        await tx.loanJourneyEvent.create({
                            data: {
                                loanId: topUp.oldLoanId,
                                eventType: 'LOAN_CLEARED',
                                description: `Loan cleared via offset from ${loan.loanApplicationNumber}`,
                                actorId: session!.user.id
                            }
                        })
                    }
                }

                // 3. Update New Loan State
                await tx.loan.update({
                    where: { id: loanId },
                    data: {
                        status: 'ACTIVE',
                        current_balance: strictBalance.toNumber(),
                        outstandingBalance: strictBalance,
                        disbursementDate: new Date(),
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        nextInterestRunDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
                    }
                })

                // 4. Update Member Wallet (Legacy/Projection)
                if (netDisbursement > 0) {
                    // Wallet was ensured at step 2 (memberWallet)

                    // 5. Create Wallet Transaction Record
                    await tx.walletTransaction.create({
                        data: {
                            walletId: memberWallet.id,
                            type: 'LOAN_DISBURSEMENT',
                            amount: netDisbursement,
                            description: `Loan Disbursement ${loan.loanApplicationNumber}`,
                            balanceAfter: 0,
                            relatedLoanId: loan.id
                        }
                    })
                }

                // 4. Create Notification
                await tx.notification.create({
                    data: {
                        memberId: loan.memberId,
                        type: NotificationType.LOAN_DISBURSED,
                        message: `Your loan ${loan.loanApplicationNumber} of KES ${parsedAmount(principal)} has been disbursed to your wallet.`,
                        loanId: loan.id
                    }
                })

                // 5. Journey Event
                await tx.loanJourneyEvent.create({
                    data: {
                        loanId: loanId,
                        eventType: LoanEventType.LOAN_DISBURSED,
                        description: `Loan disbursed (Ref: ${je.entryNumber})`,
                        actorId: session!.user.id,
                        metadata: {
                            netDisbursement: derivedNetDisbursement,
                            jeId: je.id
                        }
                    }
                })

                // 7. Initialize Interest Accrual engine
                const { InterestService } = await import('@/services/interest-engine')
                await InterestService.processDisbursementAccrual(loan.id, tx)

                return { success: true, message: "Loan Disbursed Successfully", reference: je.id }
            }, {
                maxWait: 10000,
                timeout: 30000
            })

        })(loanId);
}

/**
 * Get loan journey (timeline of events)
 */
export async function getLoanJourney(loanId: string) {
    const events = await prisma.loanJourneyEvent.findMany({
        where: { loanId },
        orderBy: { timestamp: 'asc' }
    })
    return events
}


// --- Helpers ---
async function getAccountId(tx: any, code: string) {
    if (!code) throw new Error("gl account code is undefined - check system account mappings configuration")

    // Try to find existing
    const acc = await tx.ledgerAccount.findUnique({ where: { code } })
    if (acc) return acc.id

    // Auto-seed if missing to prevent FK crashes
    console.log(`Auto-seeding missing GL Account: ${code}`)

    // Simple type deduction based on standard accounting codes
    let type = 'ASSET'
    let name = 'Auto-Generated Asset'

    // AccountType Enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    // '4' is usually Income/Revenue
    if (code.startsWith('1')) { type = 'ASSET'; name = 'Asset Account'; }
    else if (code.startsWith('2')) { type = 'LIABILITY'; name = 'Liability Account'; }
    else if (code.startsWith('3')) { type = 'EQUITY'; name = 'Equity Account'; }
    else if (code.startsWith('4')) { type = 'REVENUE'; name = 'Revenue Account'; } // Changing INCOME to REVENUE
    else if (code.startsWith('5')) { type = 'EXPENSE'; name = 'Expense Account'; }

    // Specific names based on known codes
    if (code === '1200') name = 'Loan Portfolio'
    if (code === '2000') name = 'Member Deposits / Wallets'
    if (code === '2200') name = 'Share Capital'
    if (code === '4000') name = 'Processing Fee Income'
    if (code === '4200') name = 'Insurance Fee Income'

    try {
        const newAcc = await tx.ledgerAccount.create({
            data: {
                code,
                name: `${name} (${code})`,
                type: type as any,
                isActive: true,
                allowManualEntry: true
            }
        })
        return newAcc.id
    } catch (e) {
        // Handle race condition
        const retry = await tx.ledgerAccount.findUnique({ where: { code } })
        if (retry) return retry.id
        throw new Error(`Failed to create GL Account ${code}`)
    }
}

function getDefaultCode(type: string) {
    switch (type) {
        case 'LOAN_PORTFOLIO': return '1200'
        case 'FEE_INCOME': return '4000'
        case 'INTEREST_INCOME': return '4100' // Interest Income
        case 'PENALTY_INCOME': return '4200' // Penalty Income
        default: return '9999'
    }
}

/**
 * Toggle Member's ability to approve loans
 */
export async function toggleMemberApprovalRight(memberId: string) {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    // Check permissions (Only Admin/Chair/Secretary/Treasurer)
    const allowedRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'SECRETARY', 'TREASURER', 'SYSTEM_ADMINISTRATOR']
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
        throw new Error("Insufficient permissions to manage approval rights")
    }

    await prisma.$transaction(async (tx) => {
        const member: any = await tx.member.findUnique({ where: { id: memberId } })
        if (!member) throw new Error("Member not found")

        await tx.member.update({
            where: { id: memberId },
            // @ts-ignore
            data: { canApproveLoan: !member.canApproveLoan }
        })

        // Log action
        await tx.auditLog.create({
            data: {
                userId: session.user.id!,
                action: AuditLogAction.USER_RIGHTS_UPDATED,
                details: `Toggled approval rights for member ${member.memberNumber} to ${!member.canApproveLoan}`
            }
        })
    })

    revalidatePath('/admin/system')
    revalidatePath('/members')
}

export async function cancelLoanApplication(loanId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
            where: { id: loanId },
            include: { member: true }
        })

        if (!loan) throw new Error("Loan not found")

        if (loan.status !== 'PENDING_APPROVAL') {
            throw new Error("Only pending loans can be cancelled")
        }

        await tx.loan.update({
            where: { id: loanId },
            data: { status: 'CANCELLED' }
        })

        await tx.loanJourneyEvent.create({
            data: {
                loanId,
                eventType: LoanEventType.APPROVAL_REJECTED,
                description: `Application cancelled/withdrawn by ${session.user.name || 'User'}`,
                actorId: session.user.id!
            }
        })
    })

    revalidatePath(`/loans/${loanId}`)
    revalidatePath('/dashboard')
}

/**
 * Retract a loan application (Return to Draft/Application status)
 */
export async function retractLoanApplication(loanId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
            where: { id: loanId }
        })

        if (!loan) throw new Error("Loan not found")

        // Allow retraction from PENDING or APPROVED (before disbursement)
        if (!['PENDING_APPROVAL', 'APPROVED'].includes(loan.status)) {
            throw new Error("Only pending or approved loans can be retracted")
        }

        await tx.loan.update({
            where: { id: loanId },
            data: { status: 'APPLICATION' }
        })

        // Reset approvals? Ideally yes, but simpler to just change status for now.
        // Existing votes remain but status is back to start. 
        // A cleaner approach would be clearing votes, but let's keep it simple.

        await tx.loanJourneyEvent.create({
            data: {
                loanId,
                eventType: 'APPROVAL_REJECTED', // Using closest existing type or generic info
                description: `Application retracted/returned to draft by ${session.user.name || 'User'}`,
                actorId: session.user.id!
            }
        })
    })

    revalidatePath(`/loans/${loanId}`)
    revalidatePath('/dashboard')
}
