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
import { withAudit } from '@/lib/with-audit'
import { AuditContext } from '@/lib/audit-context'

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
export const submitLoanApproval = withAudit(
    AuditLogAction.LOAN_VOTE_CAST,
    async (loanId: string, decision: 'APPROVED' | 'REJECTED', notes: string) => {
        const session = await auth()

        // @ts-ignore
        if (!session?.user?.memberId) {
            throw new Error("Unauthorized: You must be a member to approve loans")
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
                        { OR: [{ loanId: loanId }, { loanId: null }] } // Specific loan or global
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
                throw new Error("Unauthorized: You do not have permission (direct or delegated) to approve loans")
            }
        }

        AuditContext.log("Permission Checked", { approverId, role: userRole });

        // 1. Transaction to record vote and check quorum
        const result = await prisma.$transaction(async (tx) => {
            // MAKER-CHECKER VALIDATION: Prevent self-approval
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                select: { memberId: true, loanApplicationNumber: true }
            })

            if (!loan) throw new Error("Loan not found")

            if (loan.memberId === approverId) {
                throw new Error("Compliance Error: You cannot approve your own loan application")
            }

            // Check if user has already voted
            const existingVote = await tx.loanApproval.findFirst({
                where: {
                    loanId,
                    approverId
                }
            })

            if (existingVote) {
                throw new Error("You have already voted on this loan")
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

            AuditContext.log("Vote Recorded", { decision, notes });

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

                AuditContext.log("Loan Rejected", { reason: "Vote was REJECTED" })
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

            AuditContext.log("Quorum Status", { approvedCount, requiredApprovals, hasExecutiveApproval });

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

                AuditContext.log("Loan Fully Approved", { approvedCount })
                return { status: 'APPROVED', message: 'Loan Approved Successfully' }
            } else if (approvedCount >= requiredApprovals && !hasExecutiveApproval) {
                // Quantity met, Quality failed
                return { status: 'PENDING_EXECUTIVE', message: 'Quorum met, waiting for Executive Approval' }
            }

            return { status: 'PENDING_QUORUM', message: `Vote recorded. (${approvedCount}/${requiredApprovals})` }
        })

        revalidatePath(`/loans/${loanId}`)
        revalidatePath('/dashboard')

        return result || { success: true }
    }
)

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

                // 1. Calculate Amounts using Decimal for precision
                const dPrincipal = new Prisma.Decimal(loan.amount || 0).toDecimalPlaces(2)
                const dProcessingFee = new Prisma.Decimal(loan.processingFee || 0).toDecimalPlaces(2)
                const dInsuranceFee = new Prisma.Decimal(loan.insuranceFee || 0).toDecimalPlaces(2)
                const dShareDeduction = new Prisma.Decimal(loan.shareCapitalDeduction || 0).toDecimalPlaces(2)

                // 3. Resolve System Mappings early for use in calculations
                const mappings = await getSystemMappingsDict()
                const { DEFAULT_MAPPINGS } = await import('@/lib/accounting/constants')
                const getCode = (type: SystemAccountType) => mappings[type] || DEFAULT_MAPPINGS[type]
                const fundingAccountCode = getCode('EVENT_LOAN_DISBURSEMENT')

                const getAccountId = async (tx: Prisma.TransactionClient, code: string) => {
                    const acc = await tx.ledgerAccount.findUnique({ where: { code } })
                    if (!acc) throw new Error(`Account with code ${code} not found. Ensure system accounting is configured.`)
                    return acc.id
                }

                // 2. Resolve Member Wallet
                const memberWallet = await WalletService.createWallet(loan.memberId, tx)
                const memberWalletAccountId = memberWallet.glAccountId

                // 5. Rebuild Journal Lines using "Balanced by Construction" approach
                const finalJournalLines: any[] = []
                let idx = 0
                let totalDeductionsCredit = new Prisma.Decimal(0)

                // A. DEBIT: Principal (The Source of Truth for the entry balance)
                finalJournalLines.push({
                    accountId: (await getAccountId(tx, fundingAccountCode)),
                    accountType: 'ASSET',
                    description: `Principal Disbursement - ${loan.loanApplicationNumber}`,
                    debitAmount: dPrincipal,
                    creditAmount: 0,
                    index: idx++
                })

                // B. CREDIT: Fees & Top-up Deductions
                // Processing Fee
                if (dProcessingFee.gt(0)) {
                    const accId = await getAccountId(tx, getCode('INCOME_LOAN_PROCESSING_FEE'))
                    finalJournalLines.push({
                        accountId: accId,
                        accountType: 'INCOME',
                        description: 'Processing Fee',
                        debitAmount: 0,
                        creditAmount: dProcessingFee,
                        index: idx++
                    })
                    totalDeductionsCredit = totalDeductionsCredit.plus(dProcessingFee)
                }

                // Insurance Fee
                if (dInsuranceFee.gt(0)) {
                    const accId = await getAccountId(tx, getCode('INCOME_GENERAL_FEE'))
                    finalJournalLines.push({
                        accountId: accId,
                        accountType: 'INCOME',
                        description: 'Insurance Fee',
                        debitAmount: 0,
                        creditAmount: dInsuranceFee,
                        index: idx++
                    })
                    totalDeductionsCredit = totalDeductionsCredit.plus(dInsuranceFee)
                }

                // Share Capital / Contribution Deduction
                if (dShareDeduction.gt(0)) {
                    const accId = await getAccountId(tx, getCode('CONTRIBUTIONS'))
                    finalJournalLines.push({
                        accountId: accId,
                        accountType: 'ASSET',
                        description: 'Contribution Deduction',
                        debitAmount: 0,
                        creditAmount: dShareDeduction,
                        index: idx++
                    })
                    totalDeductionsCredit = totalDeductionsCredit.plus(dShareDeduction)
                }

                // Offsets (Clearance and Refinance Fees)
                for (const topUp of loan.topUps) {
                    const dTopUpTotal = new Prisma.Decimal(topUp.totalOffset).toDecimalPlaces(2)
                    const dRefinanceFee = new Prisma.Decimal(topUp.refinanceFee || 0).toDecimalPlaces(2)
                    const dClearance = dTopUpTotal.minus(dRefinanceFee)

                    if (dClearance.gt(0)) {
                        const accId = await getAccountId(tx, getCode('RECEIVABLES'))
                        finalJournalLines.push({
                            accountId: accId,
                            accountType: 'ASSET',
                            description: `Offset Clearance - ${topUp.oldLoanNumber}`,
                            debitAmount: 0,
                            creditAmount: dClearance,
                            index: idx++
                        })
                        totalDeductionsCredit = totalDeductionsCredit.plus(dClearance)
                    }

                    if (dRefinanceFee.gt(0)) {
                        const accId = await getAccountId(tx, getCode('INCOME_REFINANCE_FEE'))
                        finalJournalLines.push({
                            accountId: accId,
                            accountType: 'INCOME',
                            description: `Refinance Fee - ${topUp.oldLoanNumber}`,
                            debitAmount: 0,
                            creditAmount: dRefinanceFee,
                            index: idx++
                        })
                        totalDeductionsCredit = totalDeductionsCredit.plus(dRefinanceFee)
                    }
                }

                // C. DERIVE Net Disbursement (Credit to Member Wallet)
                // Balance Requirement: Sum(Debits) = Sum(Credits)
                // Principal (Debit) = TotalDeductions (Credit) + NetDisbursement (Credit)
                // Therefore: NetDisbursement = Principal - TotalDeductions
                const dDerivedNetDisbursement = dPrincipal.minus(totalDeductionsCredit)

                if (dDerivedNetDisbursement.lt(0)) {
                    throw new Error(
                        `Cannot disburse loan: Total deductions (KES ${totalDeductionsCredit.toFixed(2)}) ` +
                        `exceed the principal amount (KES ${dPrincipal.toFixed(2)}). ` +
                        `Net: KES ${dDerivedNetDisbursement.toFixed(2)}.`
                    )
                }

                if (dDerivedNetDisbursement.gt(0)) {
                    finalJournalLines.push({
                        accountId: memberWalletAccountId,
                        accountType: 'LIABILITY',
                        description: `Net Disbursement to Wallet`,
                        debitAmount: 0,
                        creditAmount: dDerivedNetDisbursement,
                        index: idx++
                    })
                }

                const je = await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'LOAN_DISBURSEMENT',
                    referenceId: loan.id,
                    description: `Disbursement for Loan ${loan.loanApplicationNumber}`,
                    createdBy: session!.user.id!,
                    createdByName: session!.user.name || 'Unknown',
                    lines: finalJournalLines
                }, tx)

                AuditContext.track('Journal Entry Posted', { jeId: je.id, totalAmount: dPrincipal.toNumber() });

                // 7. Update System State
                // 2b. Strict Loan Ledger Transaction (New Loan - DEBIT)
                await tx.loanTransaction.create({
                    data: {
                        loanId: loan.id,
                        type: 'DISBURSEMENT',
                        amount: dPrincipal,
                        description: `Disbursement (Ref: ${je.entryNumber})`,
                        referenceId: je.id,
                        postedAt: new Date(),
                        transactionDate: new Date()
                    }
                });

                // 2c. Force Balance Update (New Loan)
                const strictBalance = await LoanBalanceService.updateLoanBalance(loanId, tx);

                // 2d. Process Offsets (Old Loans - REPAYMENT)
                for (const topUp of loan.topUps) {
                    const dTopUpTotal = new Prisma.Decimal(topUp.totalOffset)
                    const dRefinanceFee = new Prisma.Decimal(topUp.refinanceFee || 0)
                    const dClearance = dTopUpTotal.minus(dRefinanceFee)

                    if (dClearance.gt(0)) {
                        // Create Repayment Transaction for old loan
                        await tx.loanTransaction.create({
                            data: {
                                loanId: topUp.oldLoanId,
                                type: 'REPAYMENT',
                                amount: dClearance,
                                description: `Offset by New Loan ${loan.loanApplicationNumber}`,
                                referenceId: je.id,
                                postedAt: new Date(),
                                transactionDate: new Date()
                            }
                        })

                        // Update Old Loan Balance
                        const oldLoanBalance = await LoanBalanceService.updateLoanBalance(topUp.oldLoanId, tx)

                        // Check if cleared
                        if (oldLoanBalance.lte(0.01)) {
                            await tx.loan.update({
                                where: { id: topUp.oldLoanId },
                                data: { status: 'CLEARED' }
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

                // 4. Wallet Transaction
                if (dDerivedNetDisbursement.gt(0)) {
                    await tx.walletTransaction.create({
                        data: {
                            walletId: memberWallet.id,
                            type: 'LOAN_DISBURSEMENT',
                            amount: dDerivedNetDisbursement,
                            description: `Loan Disbursement ${loan.loanApplicationNumber}`,
                            balanceAfter: 0,
                            relatedLoanId: loan.id
                        }
                    })
                }

                // 5. Create Notification
                await tx.notification.create({
                    data: {
                        memberId: loan.memberId,
                        type: NotificationType.LOAN_DISBURSED,
                        message: `Your loan ${loan.loanApplicationNumber} of KES ${dPrincipal.toFixed(2)} has been disbursed.`,
                        loanId: loan.id
                    }
                })

                // 6. Journey Event
                await tx.loanJourneyEvent.create({
                    data: {
                        loanId: loanId,
                        eventType: LoanEventType.LOAN_DISBURSED,
                        description: `Loan disbursed (Ref: ${je.entryNumber})`,
                        actorId: session!.user.id,
                        metadata: {
                            netDisbursement: dDerivedNetDisbursement,
                            jeId: je.id
                        }
                    }
                })

                // 7. Initialize Interest Accrual engine
                const { InterestService } = await import('@/services/interest-engine')
                await InterestService.processDisbursementAccrual(loan.id, tx)

                return { success: true, message: "Loan Disbursed Successfully", reference: je.id }
            }, {
                maxWait: 15000,
                timeout: 45000
            })

        })(loanId);
}

/**
 * Get loan journey (timeline of events)
 */
export async function getLoanJourney(loanId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

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
    if (code === '3012') name = 'Member Withdrawable Wallet'
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
        case 'LOAN_PORTFOLIO': return '1021' // Principal Loans to Members
        case 'FEE_INCOME': return '4021' // Processing Fees
        case 'INTEREST_INCOME': return '4011' // Interest on Loans
        case 'PENALTY_INCOME': return '4012' // Interest on Penalties
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

    // Note: This function remains as is, as it's separate from loan processing
    // Implementation would go here if needed...
}

function parsedAmount(amount: any) {
    return Number(amount).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })
}
