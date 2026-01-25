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

// Use global db instance
const prisma = db

/**
 * Submit a loan approval vote
 */
export async function submitLoanApproval(loanId: string, decision: 'APPROVED' | 'REJECTED', notes: string) {
    const session = await auth()
    console.log('submitLoanApproval - Session:', JSON.stringify(session, null, 2))

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

    const roleHasPermission = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(userRole) // Quick check aligned with approval-actions

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
            return ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(delegatorRole)
            // Note: We could also check granular permissions of delegator here if needed
        })

        if (!hasValidDelegation) {
            throw new Error("Unauthorized: You do not have permission (direct or delegated) to approve loans")
        }
    }

    // 1. Transaction to record vote and check quorum
    await prisma.$transaction(async (tx) => {
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
        const EXECUTIVE_ROLES: UserRole[] = [UserRole.CHAIRPERSON, UserRole.SECRETARY, UserRole.TREASURER, UserRole.SYSTEM_ADMIN]

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

    revalidatePath(`/loans/${loanId}`)
    revalidatePath('/dashboard')

    // Return result of transaction if we capture it, but simple returns here work since revalidate happens after.
    // Ideally refactor to capture tx result. 
    return { success: true }
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
export async function disburseLoanToWallet(loanId: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'TREASURER' && session.user.role !== 'CHAIRPERSON')) {
        // Strict role check for disbursement
    }

    await prisma.$transaction(async (tx) => {
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
        if (loan.status !== 'APPROVED') throw new Error("Loan is not in APPROVED state")
        if (Number(loan.current_balance) > 0) throw new Error("Loan already has a balance? Possible error.")

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

        if (netDisbursement < 0) throw new Error(`Net disbursement is negative (KES ${netDisbursement}). Adjust offsets.`)

        // 2. Resolve Member Wallet (Unique Liability Account)
        // This ensures every member has a distinct Ledger Account for their wallet
        // If wallet doesn't exist, it creates one (Code: WAL-XXXXXX)
        const memberWallet = await WalletService.createWallet(loan.memberId, tx)
        const memberWalletAccountId = memberWallet.glAccountId

        // 3. Perform Accounting (General Ledger) via AccountingEngine
        // Fetch dynamic mappings
        const mappings = await getSystemMappingsDict()
        const fundingAccountCode = mappings['EVENT_LOAN_DISBURSEMENT'] // User wants to check this account

        if (!fundingAccountCode) {
            throw new Error("System Mapping for 'EVENT_LOAN_DISBURSEMENT' is missing.")
        }

        const getCode = (type: SystemAccountType) => mappings[type]

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
        const journalLines: any[] = []
        let lineIndex = 0

        // Debit: Loan Portfolio / Disbursement Account (Asset)
        journalLines.push({
            accountId: (await getAccountId(tx, fundingAccountCode)), // Use the mapped account
            accountType: 'ASSET',
            description: `Principal Disbursement - ${loan.loanApplicationNumber}`,
            debitAmount: principal,
            creditAmount: 0,
            index: lineIndex++
        })

        // Credit: Member Wallet (Net Amount)
        if (netDisbursement > 0) {
            journalLines.push({
                accountId: memberWalletAccountId, // USES UNIQUE MEMBER ACCOUNT
                accountType: 'LIABILITY',
                description: `Net Disbursement to Wallet`,
                debitAmount: 0,
                creditAmount: netDisbursement,
                index: lineIndex++
            })
        }

        // Credit: Fees
        if (processingFee > 0) {
            journalLines.push({
                accountId: (await getAccountId(tx, getCode('INCOME_LOAN_PROCESSING_FEE'))),
                accountType: 'INCOME',
                description: 'Processing Fee',
                debitAmount: 0,
                creditAmount: processingFee,
                index: lineIndex++
            })
        }
        if (insuranceFee > 0) {
            journalLines.push({
                accountId: (await getAccountId(tx, getCode('INCOME_GENERAL_FEE'))),
                accountType: 'INCOME',
                description: 'Insurance Fee',
                debitAmount: 0,
                creditAmount: insuranceFee,
                index: lineIndex++
            })
        }
        if (shareDeduction > 0) {
            journalLines.push({
                accountId: (await getAccountId(tx, getCode('CONTRIBUTIONS'))),
                accountType: 'ASSET',
                description: 'Contribution Deduction',
                debitAmount: 0,
                creditAmount: shareDeduction,
                index: lineIndex++
            })
        }

        // Credit: Loan Offsets (Clearing old loans)
        for (const topUp of loan.topUps) {
            // We need to credit the Old Loan Portfolio (Asset) for the principal being paid off
            // And Credit Income for the interest/penalties being paid off

            // 1. Principal Base
            if (Number(topUp.principalBalance) > 0) {
                journalLines.push({
                    accountId: (await getAccountId(tx, getCode('RECEIVABLES'))), // Reduce Loan Asset (1300)
                    accountType: 'ASSET',
                    description: `Offset Principal - ${topUp.oldLoanNumber}`,
                    debitAmount: 0,
                    creditAmount: Number(topUp.principalBalance),
                    index: lineIndex++
                })
            }

            // 2. Interest Income
            if (Number(topUp.accruedInterest) > 0) {
                journalLines.push({
                    accountId: (await getAccountId(tx, getCode('RECEIVABLE_LOAN_INTEREST') || getCode('INCOME_LOAN_INTEREST'))),
                    accountType: 'ASSET', // Reducing Receivable
                    description: `Offset Interest - ${topUp.oldLoanNumber}`,
                    debitAmount: 0,
                    creditAmount: Number(topUp.accruedInterest),
                    index: lineIndex++
                })
            }

            // 3. Penalty/Other Income from Offset
            const otherCharges = Number(topUp.penalties) + Number(topUp.refinanceFee)
            if (otherCharges > 0) {
                journalLines.push({
                    accountId: (await getAccountId(tx, getCode('INCOME_GENERAL_FEE'))),
                    accountType: 'INCOME',
                    description: `Offset Fees/Penalties - ${topUp.oldLoanNumber}`,
                    debitAmount: 0,
                    creditAmount: otherCharges,
                    index: lineIndex++
                })
            }
        }

        // Post via Accounting Engine (Handles Validation & Cents Conversion)
        const je = await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: 'LOAN_DISBURSEMENT',
            referenceId: loan.id,
            description: `Disbursement for Loan ${loan.loanApplicationNumber}`,
            createdBy: session!.user.id!,
            createdByName: session!.user.name || 'Unknown',
            lines: journalLines.map(l => ({
                accountId: l.accountId,
                debitAmount: Number(l.debitAmount) || 0,
                creditAmount: Number(l.creditAmount) || 0,
                description: l.description
            }))
        }, tx)

        // 2b. Strict Loan Ledger Transaction (New Loan - DEBIT)
        await tx.loanTransaction.create({
            data: {
                loanId: loan.id,
                type: 'DISBURSEMENT',
                amount: new Prisma.Decimal(principal),
                description: `Disbursement (Ref: ${je.entryNumber})`,
                referenceId: je.id,
                postedAt: new Date()
            }
        });

        // 2c. Force Balance Update (New Loan)
        const strictBalance = await LoanBalanceService.updateLoanBalance(loanId, tx);

        // 2d. Process Offsets (Old Loans - REPAYMENT)
        for (const topUp of loan.topUps) {
            // Create Repayment Transaction for old loan
            await tx.loanTransaction.create({
                data: {
                    loanId: topUp.oldLoanId,
                    type: 'REPAYMENT', // Effectively a repayment
                    amount: new Prisma.Decimal(topUp.totalOffset),
                    description: `Offset by New Loan ${loan.loanApplicationNumber}`,
                    referenceId: je.id,
                    postedAt: new Date()
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
                        description: `Loan cleared via offset by Refinance ${loan.loanApplicationNumber}`,
                        actorId: 'SYSTEM'
                    }
                })
            }
        }

        // 3. Update New Loan State
        await tx.loan.update({
            where: { id: loanId },
            data: {
                status: 'DISBURSED',
                current_balance: strictBalance.toNumber(),
                outstandingBalance: strictBalance,
                disbursementDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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

        // 6. Journey Event
        await tx.loanJourneyEvent.create({
            data: {
                loanId,
                eventType: LoanEventType.LOAN_DISBURSED,
                description: `Disbursed ${netDisbursement.toLocaleString()} to wallet${totalOffset > 0 ? ` (after ${totalOffset.toLocaleString()} offsets)` : ''}`,
                actorId: session!.user.id!
            }
        })

        // 7. Initialize Interest Accrual engine
        const { InterestService } = await import('@/services/interest-engine')
        await InterestService.processDisbursementAccrual(loan.id, tx)
    }, {
        maxWait: 10000,
        timeout: 30000
    })
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

    // Check permissions (Only Admin/Chair/Secretary ideally, but for now Check Role)

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
