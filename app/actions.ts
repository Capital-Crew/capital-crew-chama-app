
'use server'

import { revalidatePath } from 'next/cache'
import { Prisma, AuditLogAction } from '@prisma/client'
import { db as prisma } from '../lib/db'
import { auth } from '@/auth'
import { WalletService } from '@/lib/services/WalletService'
import {
    LoanStatus, ApprovalStatus, NotificationType, RepaymentFrequencyType,
    InterestType, AmortizationType, InterestCalculationPeriodType
} from '@/lib/types'
import { generateLoanApplicationNumber, generateRepaymentSchedule } from '../lib/utils'
import { calculateTopUpDetails, validateNetLoan } from '@/lib/topup-calculator'
import { withAudit } from '@/lib/with-audit'

export async function createMember(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Check admin permissions
    const userRole = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, permissions: true }
    })

    const isSystemAdmin = userRole?.role === 'SYSTEM_ADMIN'
    const hasEnrollPermission = (userRole?.permissions as any)?.canEnrollMembers === true
    if (!isSystemAdmin && !['CHAIRPERSON', 'SECRETARY', 'TREASURER'].includes(userRole?.role as string) && !hasEnrollPermission) {
        throw new Error('Unauthorized: You do not have permission to enroll members.')
    }

    const name = formData.get('name') as string
    const contact = formData.get('contact') as string

    // Generate member number
    const lastMember = await prisma.member.findFirst({ orderBy: { memberNumber: 'desc' } })
    const memberNumber = (lastMember?.memberNumber || 0) + 1

    // Create member and wallet in a transaction
    const member = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newMember = await tx.member.create({
            data: {
                name,
                contact,
                memberNumber,
            },
        })

        // Create Wallet
        await WalletService.createWallet(newMember.id, tx)

        // Create notification
        await tx.notification.create({
            data: {
                memberId: newMember.id,
                type: NotificationType.SYSTEM_UPDATE,
                message: `Welcome onboard, ${newMember.name}!`,
            }
        })

        // NEW: Initiate Workflow for Member Onboarding
        try {
            const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
            await initiateWorkflow('MEMBER', newMember.id, newMember.id)
        } catch (error) {
            // TODO: Log error to monitoring service
        }

        return newMember
    })

    revalidatePath('/members')
    revalidatePath('/dashboard')
    return member
}

export async function createUserAccount(formData: FormData) {
    // 1. Strict Role Check
    const session = await auth(); // Using auth() from @/auth as imported in other files, but wait, this file imports prisma from relative. 




    // Let's implement the logic assuming `auth` is available, and then I'll add the import.

    const name = formData.get('name') as string
    const contact = formData.get('contact') as string
    const email = (formData.get('email') as string).toLowerCase().trim()

    const role = (formData.get('role') as any) || 'MEMBER'

    // Validate required fields
    if (!name || !contact || !email) {
        throw new Error('All fields are required')
    }

    // Role & Permission Check
    const userRole = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { role: true, permissions: true }
    })

    const permissions = userRole?.permissions as any
    const isSystemAdmin = userRole?.role === 'SYSTEM_ADMIN'
    const hasEnrollPermission = permissions?.canEnrollMembers === true

    if (!isSystemAdmin && !['CHAIRPERSON', 'SECRETARY', 'TREASURER'].includes(userRole?.role as string) && !hasEnrollPermission) {
        throw new Error('Unauthorized: You do not have permission to enroll members.')
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        throw new Error('Email already in use')
    }

    // Default Password Logic
    const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD;
    if (!defaultPassword) {
      throw new Error("DEFAULT_MEMBER_PASSWORD environment variable is not set");
    }
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Generate member number
    const lastMember = await prisma.member.findFirst({ orderBy: { memberNumber: 'desc' } })
    const memberNumber = (lastMember?.memberNumber || 0) + 1

    // Create member and user in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const member = await tx.member.create({
            data: {
                name,
                contact,
                memberNumber,
            },
        })

        // Create MemberContact with email so it appears on the member's profile
        await tx.memberContact.create({
            data: {
                memberId: member.id,
                email,
                mobile: contact,
            },
        })

        // Define Permissions based on Role
        let userPermissions = {}
        if (role === 'MEMBER') {
            userPermissions = {
                canViewAll: false,
                canAddData: false,
                canApprove: false,
                canManageSettings: false,
                canViewReports: false,
                canViewAudit: false,
                canManageUserRights: false,
                canExemptFees: false,
                canReverse: false,
                canEnrollMembers: false
            }
        } else if (role === 'SYSTEM_ADMIN') {
            userPermissions = {
                canViewAll: true,
                canAddData: true,
                canApprove: true,
                canManageSettings: true,
                canViewReports: true,
                canViewAudit: true,
                canManageUserRights: true,
                canExemptFees: true,
                canReverse: true,
                canEnrollMembers: true
            }
        } else {
            // Default Admin Permissions (Chairperson, Treasurer, Secretary)
            userPermissions = {
                canViewAll: true,
                canAddData: true,
                canApprove: true,
                canManageSettings: true,
                canViewReports: true,
                canViewAudit: true,
                canManageUserRights: true, // Typically limited, but effectively full for now
                canExemptFees: true,
                canReverse: false, // Default false for standard admins? Let's say true for now or keep safe.
                canEnrollMembers: true
            }
        }

        const user = await tx.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                mustChangePassword: true,
                name,
                role,
                memberId: member.id,
                permissions: userPermissions
            }

        })

        const wallet = await WalletService.createWallet(member.id, tx)

        // Create welcome notification
        await tx.notification.create({
            data: {
                memberId: member.id,
                type: NotificationType.SYSTEM_UPDATE,
                message: `Welcome to Capital Crew, ${member.name}! Your temporary password is: ${defaultPassword}`,
            }
        })

        return { member, user, wallet }
    })

    revalidatePath('/members')
    revalidatePath('/dashboard')
    return result
}

export const applyForLoan = withAudit(
    { actionType: AuditLogAction.LOAN_APPLIED, domain: 'LOAN', apiRoute: '/api/loans/apply' },
    async (ctx, _prevState: any, formData: FormData) => {
        ctx.beginStep('Verify Authentication');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: 'Unauthorized: You must be logged in to apply for a loan.' }
        }
        ctx.endStep('Verify Authentication');

        const memberId = formData.get('memberId') as string
        const loanProductId = formData.get('loanProductId') as string
        const amountStr = formData.get('amount') as string
        const amount = amountStr ? parseFloat(amountStr) : 0
        const contractRef = formData.get('contractRef') as string || ''
        const installments = parseInt(formData.get('installments') as string) || 12
        const loanId = formData.get('loanId') as string || null

        const loansToOffset = formData.getAll('loansToOffset') as string[]
        const submitAction = formData.get('submitAction') as string || 'save'

        const feeExemptionsStr = formData.get('feeExemptions') as string
        const feeExemptions = feeExemptionsStr ? JSON.parse(feeExemptionsStr) : {}

        const newStatus = submitAction === 'send' ? LoanStatus.PENDING_APPROVAL : LoanStatus.APPLICATION;
        const isDraftSave = newStatus === LoanStatus.APPLICATION;

        if (!memberId) {
            ctx.setErrorCode('MEMBER_ID_REQUIRED');
            return { error: 'Member ID is required.' }
        }

        ctx.beginStep('Authorization Check');
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                memberId: true,
                role: true,
                permissions: true
            }
        })

        if (!currentUser) {
            ctx.setErrorCode('USER_NOT_FOUND');
            return { error: 'User account not found.' }
        }

        const isOwner = memberId === currentUser.memberId
        const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(currentUser.role)

        if (!isOwner) {
            if (!isAdmin) {
                ctx.setErrorCode('FORBIDDEN');
                return { error: 'Unauthorized: You can only apply for loans under your own name.' }
            }
            if (submitAction === 'send') {
                ctx.setErrorCode('ADMIN_SUBMIT_FORBIDDEN');
                return { error: 'Unauthorized: Admins cannot submit applications on behalf of members. You can only save edits to exemptions.' }
            }
            if (loanId) {
                const currentLoan = await prisma.loan.findUnique({ where: { id: loanId } })
                if (currentLoan) {
                    if (
                        Math.abs(Number(currentLoan.amount) - amount) > 0.01 ||
                        currentLoan.loanProductId !== loanProductId ||
                        currentLoan.installments !== installments ||
                        currentLoan.memberId !== memberId
                    ) {
                        ctx.setErrorCode('ADMIN_MODIFY_DETAILS_FORBIDDEN');
                        return { error: 'Admins cannot modify Loan Details (Amount, Product, Installments). Only Exemptions can be edited.' }
                    }
                }
            }
        }
        ctx.endStep('Authorization Check');

        if (loanId) {
            const existingLoan = await prisma.loan.findUnique({
                where: { id: loanId },
                select: { id: true, memberId: true, status: true, submissionVersion: true }
            })
            if (!existingLoan) {
                ctx.setErrorCode('LOAN_NOT_FOUND');
                return { error: 'Loan application not found.' }
            }

            // [LOCKED STATE ENFORCEMENT]
            // Prevent editing while pending approval, unless it's a specific admin override or the action is a cancellation
            if (existingLoan.status === 'PENDING_APPROVAL') {
                ctx.setErrorCode('LOAN_LOCKED');
                return { error: 'This loan application is currently locked for editing as it is pending approval. Please cancel the current approval request if you need to make changes.' }
            }

            ctx.captureBefore('Loan', loanId, existingLoan);
        }

        ctx.beginStep('Validation');
        if (!isDraftSave) {
            if (!loanProductId) {
                ctx.setErrorCode('PRODUCT_REQUIRED');
                return { error: 'Loan Product is required.' }
            }
            if (!amount || amount <= 0) {
                ctx.setErrorCode('INVALID_AMOUNT');
                return { error: 'Valid amount is required.' }
            }

            const exemptions = feeExemptions || {}
            if (!exemptions.defaultCheck) {
                const { checkLoanEligibility } = await import('@/app/actions/loan-eligibility')
                const eligibility = await checkLoanEligibility(memberId)
                if (!eligibility.isEligible) {
                    ctx.setErrorCode('INELIGIBLE');
                    return { error: eligibility.message || 'Application Denied: Outstanding arrears detected.' }
                }
            }

            const existingApplication = await prisma.loan.findFirst({
                where: {
                    memberId,
                    status: { in: [LoanStatus.PENDING_APPROVAL, LoanStatus.APPROVED] },
                    ...(loanId ? { id: { not: loanId } } : {})
                }
            })

            if (existingApplication) {
                const exemptions = (existingApplication.feeExemptions as any) || {}
                if (!exemptions.allowConcurrentApplication) {
                    ctx.setErrorCode('CONCURRENT_APPLICATION_FORBIDDEN');
                    return { error: `You already have an active application (${existingApplication.loanApplicationNumber}).` }
                }
            }
        }

        let product = null;
        if (loanProductId) {
            product = await prisma.loanProduct.findUnique({ where: { id: loanProductId } })
            if (!product && !isDraftSave) {
                ctx.setErrorCode('PRODUCT_NOT_FOUND');
                return { error: 'Invalid product' }
            }

            if (product && !isDraftSave) {
                const interestRate = Number(product.interestRatePerPeriod)
                if (isNaN(interestRate) || interestRate < 0) {
                    ctx.setErrorCode('INVALID_PRODUCT_CONFIG');
                    return { error: 'Invalid loan product: Interest rate not configured properly.' }
                }
                if (installments < product.minRepaymentTerms || installments > product.maxRepaymentTerms) {
                    ctx.setErrorCode('INVALID_INSTALLMENTS');
                    return { error: `Installments must be between ${product.minRepaymentTerms} and ${product.maxRepaymentTerms} months.` }
                }
                const amountNum = Number(amount)
                if (amountNum < Number(product.minPrincipal) || amountNum > Number(product.maxPrincipal)) {
                    ctx.setErrorCode('INVALID_PRINCIPAL');
                    return { error: `Amount must be between KES ${Number(product.minPrincipal).toLocaleString()} and KES ${Number(product.maxPrincipal).toLocaleString()}.` }
                }
            }
        }
        ctx.endStep('Validation');

        ctx.beginStep('Appraisal Calculation');
        let appraisal = {
            memberContributions: 0,
            grossQualifyingAmount: 0,
            processingFee: 0,
            insuranceFee: 0,
            contributionDeduction: 0,
            selectedLoansOffset: 0,
            totalDeductions: 0,
            netDisbursementAmount: 0,
            topUps: [] as any[]
        };

        if (amount > 0 && product) {
            const { calculateLoanQualification } = await import('./sacco-settings-actions')
            try {
                const result = await calculateLoanQualification(memberId, loansToOffset, amount, feeExemptions)
                appraisal = { ...appraisal, ...result }
                if (!isDraftSave && !feeExemptions?.allowOverQC && amount > appraisal.grossQualifyingAmount) {
                    ctx.setErrorCode('LIMIT_EXCEEDED');
                    return { error: `Application Denied: The requested amount exceeds your maximum borrowing limit.` }
                }
            } catch (e) { }
        }
        ctx.endStep('Appraisal Calculation');

        ctx.beginStep('Top-Up Calculations');
        let topUpCalculations: any[] = []
        if (loansToOffset.length > 0 && !isDraftSave) {
            const oldLoans = await prisma.loan.findMany({
                where: { id: { in: loansToOffset } },
                include: { transactions: true }
            })
            const { processTransactions } = await import('@/lib/statementProcessor')
            const { addMoney, truncateToDecimals, calculatePercentage } = await import('@/lib/currency')
            const saccoSettings = await prisma.saccoSettings.findFirst()
            const refinanceFeePct = Number(saccoSettings?.refinanceFeePercentage || 0)

            for (const oldLoan of oldLoans) {
                const rawTransactions = oldLoan.transactions ? oldLoan.transactions.map((tx: any) => ({
                    ...tx,
                    amount: Number(tx.amount),
                    createdAt: tx.postedAt,
                    type: tx.type
                })) : [];
                const mappedTransactions = rawTransactions.map((tx: any) => ({
                    ...tx,
                    type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                        tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' : tx.type
                }));
                const rows = processTransactions(mappedTransactions as any[]);
                const balance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
                const outstandingBalance = truncateToDecimals(balance);
                const fee = calculatePercentage(outstandingBalance, refinanceFeePct);

                topUpCalculations.push({
                    loanId: oldLoan.id,
                    loanNumber: oldLoan.loanApplicationNumber,
                    productName: 'Unknown',
                    principalBalance: outstandingBalance,
                    accruedInterest: 0,
                    penalties: 0,
                    refinanceFee: fee,
                    totalOffset: addMoney(outstandingBalance, fee)
                })
            }
        }
        ctx.endStep('Top-Up Calculations');

        ctx.beginStep('Repayment Schedule Generation');
        let schedule: any[] = [];
        if (amount > 0 && product) {
            const { generateRepaymentSchedule } = await import('../lib/utils')
            const productForSchedule = {
                ...product,
                numberOfRepayments: installments || product.numberOfRepayments
            }
            schedule = generateRepaymentSchedule({ amount, applicationDate: new Date() } as any, productForSchedule)
        }
        const monthlyInstallment = schedule.length > 0 ? schedule[0].total : 0
        ctx.endStep('Repayment Schedule Generation');

        try {
            ctx.beginStep('Database Operations');
            let loan: any;
            const commonData = {
                memberId,
                loanProductId: loanProductId || null,
                amount: amount,
                applicationDate: new Date(),
                status: newStatus,
                memberContributionsAtApplication: appraisal.memberContributions,
                grossQualifyingAmount: appraisal.grossQualifyingAmount,
                processingFee: appraisal.processingFee,
                insuranceFee: appraisal.insuranceFee,
                contributionDeduction: appraisal.contributionDeduction,
                existingLoanOffset: appraisal.selectedLoansOffset,
                totalDeductions: appraisal.totalDeductions,
                netDisbursementAmount: appraisal.netDisbursementAmount,
                installments,
                monthlyInstallment,
                interestRate: product?.interestRatePerPeriod || 0,
                interestRatePerMonth: product?.interestRatePerPeriod,
                penaltyRate: product?.defaultPenaltyRate || 0,
                repaymentSchedule: schedule,
                feeExemptions,
                loanContract: contractRef,
                updatedAt: new Date()
            }

            let existingLoanState = null;
            if (loanId) {
                existingLoanState = await prisma.loan.findUnique({
                    where: { id: loanId },
                    select: { status: true, amount: true, installments: true }
                })
                loan = await prisma.loan.update({ where: { id: loanId }, data: commonData })
            } else {
                const lastLoan = await prisma.loan.findFirst({
                    orderBy: { loanApplicationNumber: 'desc' },
                    select: { loanApplicationNumber: true }
                })
                const { getNextLoanNumber } = require('../lib/utils');
                const loanApplicationNumber = getNextLoanNumber(lastLoan?.loanApplicationNumber)
                loan = await prisma.loan.create({
                    data: {
                        loanApplicationNumber,
                        ...commonData,
                        approvalVotes: [],
                        applicationFeePaid: false
                    }
                })
            }

            if (!isDraftSave) {
                if (topUpCalculations.length > 0) {
                    await prisma.loanTopUp.deleteMany({ where: { newLoanId: loan.id } });
                    await prisma.loanTopUp.createMany({
                        data: topUpCalculations.map((calc: any) => ({
                            newLoanId: loan.id,
                            oldLoanId: calc.loanId,
                            oldLoanNumber: calc.loanNumber,
                            productName: calc.productName,
                            principalBalance: calc.principalBalance,
                            accruedInterest: calc.accruedInterest,
                            penalties: calc.penalties,
                            refinanceFee: calc.refinanceFee,
                            totalOffset: calc.totalOffset
                        }))
                    })
                }

                await prisma.loanJourneyEvent.create({
                    data: {
                        loanId: loan.id,
                        eventType: 'APPLICATION_SUBMITTED',
                        description: `Loan application submitted for KES ${amount.toLocaleString()}`,
                        actorId: memberId,
                        actorName: 'Applicant',
                        metadata: {
                            requestedAmount: amount,
                            netDisbursementAmount: appraisal.netDisbursementAmount
                        }
                    }
                })

                await prisma.approvalRequest.create({
                    data: {
                        type: 'LOAN',
                        referenceId: loan.id,
                        referenceTable: 'Loan',
                        requesterId: memberId,
                        requesterName: commonData.memberId ? (await prisma.member.findUnique({ where: { id: memberId }, select: { name: true } }))?.name || 'Member' : 'Member',
                        description: `${product?.name || 'Loan'} Application - KES ${amount.toLocaleString()}`,
                        amount: amount,
                        status: 'PENDING',
                        requiredPermission: 'APPROVE_LOANS'
                    }
                })

                if (product && amount > 0) {
                    const { ScheduleGeneratorService } = await import('@/lib/services/ScheduleGeneratorService')
                    await prisma.repaymentInstallment.deleteMany({ where: { loanId: loan.id } })
                    const scheduleItems = ScheduleGeneratorService.generate(
                        Number(amount), Number(product.interestRatePerPeriod), installments,
                        product.interestType as 'FLAT' | 'DECLINING_BALANCE', new Date(), loan.id
                    )
                    await prisma.repaymentInstallment.createMany({
                        data: scheduleItems.map(item => ({ ...item, loanId: loan.id }))
                    })
                }

                if (session?.user?.id) {
                    await prisma.loanDraft.deleteMany({ where: { userId: session.user.id } })
                }

                if (newStatus === LoanStatus.PENDING_APPROVAL) {
                    if (existingLoanState && existingLoanState.status !== 'DRAFT') {
                        if (Number(existingLoanState.amount) !== amount || existingLoanState.installments !== installments) {
                            await prisma.emailNotificationLog.deleteMany({ where: { loanId: loan.id, templateType: 'LOAN_APPROVAL_REQUEST' } });
                            await prisma.loan.update({ where: { id: loan.id }, data: { submissionVersion: { increment: 1 } } });
                            // Re-fetch to get new version
                            const updated = await prisma.loan.findUnique({ where: { id: loan.id } });
                            if (updated) loan = updated as any;
                        }
                    }

                    // [UNIFIED WORKFLOW] Initiate workflow request
                    try {
                        const { initiateWorkflow } = await import('@/app/actions/workflow-engine');
                        await initiateWorkflow('LOAN', loan.id, loan.memberId, (loan as any).submissionVersion || 1);
                    } catch (workflowErr) {
                        // TODO: Log error to monitoring service
                        console.error('[WORKFLOW_INIT_FAILURE]:', workflowErr);
                        // We don't throw here as the loan is already updated to PENDING_APPROVAL.
                        // The submitLoanApproval action has auto-repair to fix this later if needed.
                    }

                    const { LoanNotificationService } = await import('@/lib/services/LoanNotificationService')
                    await LoanNotificationService.handleApprovalRequest(loan.id)
                }
            }

            ctx.captureAfter(loan);
            ctx.endStep('Database Operations');

            revalidatePath('/loans')
            revalidatePath('/dashboard')
            revalidatePath(`/loans/application/${loan.id}`)

            return { success: true, loanId: loan.id }

        } catch (e: any) {
            // TODO: Log error to monitoring service
            ctx.setErrorCode('DATABASE_ERROR');
            return { error: e.message || 'Failed to process loan application' }
        }
    }
);

export async function submitVote(loanId: string, decision: ApprovalStatus, notes: string, userId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Ensure the voter is the logged in user, or an admin
    if (userId !== session.user.id && !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes((session.user as any).role)) {
        throw new Error('Unauthorized: Cannot vote on behalf of another user')
    }

    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return { error: 'Loan not found' }

    const votes = (loan.approvalVotes as any[]) || []
    const newVote = {
        voterId: userId,
        decision,
        notes,
        timestamp: new Date().toISOString()
    }

    const updatedVotes = [...votes, newVote]
    let newStatus = loan.status

    if (decision === ApprovalStatus.REJECTED) {
        newStatus = LoanStatus.REJECTED
        await prisma.notification.create({
            data: {
                memberId: loan.memberId,
                type: NotificationType.LOAN_REJECTED,
                message: `Your application ${loan.loanApplicationNumber} has been declined.`,
                loanId: loan.id
            }
        })
    } else {
        const approvedCount = updatedVotes.filter((v: any) => v.decision === ApprovalStatus.APPROVED).length
        if (approvedCount >= 1) {
            if (newStatus !== LoanStatus.ACTIVE) {
                newStatus = LoanStatus.ACTIVE
                await prisma.notification.create({
                    data: {
                        memberId: loan.memberId,
                        type: NotificationType.LOAN_APPROVED,
                        message: `Great news! Application ${loan.loanApplicationNumber} is approved and ready for payout.`,
                        loanId: loan.id
                    }
                })
            }
        }
    }

    await prisma.loan.update({
        where: { id: loanId },
        data: {
            approvalVotes: updatedVotes,
            status: newStatus
        }
    })

    revalidatePath('/loans')
    revalidatePath('/dashboard')
}

export async function disburseLoan(loanId: string) {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes((session.user as any).role)
    if (!isAdmin) throw new Error('Unauthorized: Only administrators can disburse loans via legacy flow')

    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return

    await prisma.loan.update({
        where: { id: loanId },
        data: {
            status: LoanStatus.DISBURSED,
            disbursementDate: new Date(),
            cachedSchedule: null // Invalidate Cache on Disbursement
        }
    })

    const { LoanNotificationService } = await import('@/lib/services/LoanNotificationService')
    await LoanNotificationService.handleDisbursement(loanId)
}

export const createLoanProduct = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'SYSTEM', apiRoute: '/api/admin/products' },
    async (ctx, formData: FormData) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes((session.user as any).role)) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized: Only administrators can manage loan products')
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Create Loan Product');
        const product = await prisma.loanProduct.create({
            data: {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                minPrincipal: parseFloat(formData.get('minPrincipal') as string),
                maxPrincipal: parseFloat(formData.get('maxPrincipal') as string),
                interestRatePerPeriod: parseFloat(formData.get('interestRate') as string),
                defaultPenaltyRate: parseFloat(formData.get('penaltyRate') as string),
                minRepaymentTerms: parseInt(formData.get('minTerms') as string),
                maxRepaymentTerms: parseInt(formData.get('maxTerms') as string),
                interestType: InterestType.REDUCING_BALANCE,
                repaymentFrequency: RepaymentFrequencyType.MONTHLY,
                amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
                charges: [],
                isActive: true
            }
        })
        ctx.captureAfter(product);
        ctx.endStep('Create Loan Product');

        revalidatePath('/admin/system')
        return product
    }
);

export const createChargeTemplate = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'SYSTEM', apiRoute: '/api/admin/charges' },
    async (ctx, formData: FormData) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes((session.user as any).role)) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized: Only administrators can manage charge templates')
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Create Charge Template');
        const name = formData.get('name') as string
        const amount = parseFloat(formData.get('amount') as string)

        const template = await prisma.chargeTemplate.create({
            data: {
                name,
                chargeType: 'FEE',
                calculationType: 'FIXED',
                amount,
                dueDateOffset: 0,
                isActive: true
            }
        })
        ctx.captureAfter(template);
        ctx.endStep('Create Charge Template');

        revalidatePath('/admin/system')
        return template
    }
);

// NEW: Workflow Actions

/**
 * Submit a APPLICATION loan for approval
 */
export const submitLoanApplication = withAudit(
    { actionType: AuditLogAction.LOAN_APPLIED, domain: 'LOAN', apiRoute: '/api/loans/submit' },
    async (ctx, loanId: string) => {
        ctx.beginStep('Verify Authentication');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: 'Unauthorized' }
        }
        ctx.endStep('Verify Authentication');

        ctx.beginStep('Fetch Loan Data');
        const user = await prisma.user.findUnique({ where: { id: session?.user?.id } })

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { member: true, loanProduct: true }
        })

        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            return { error: 'Loan not found' }
        }
        if (loan.status !== 'APPLICATION') {
            ctx.setErrorCode('INVALID_STATUS');
            return { error: 'Loan is not in APPLICATION status' }
        }
        ctx.captureBefore('Loan', loanId, loan);
        ctx.endStep('Fetch Loan Data');

        ctx.beginStep('Eligibility Check');
        const { checkLoanEligibility } = await import('@/app/actions/loan-eligibility')
        const eligibility = await checkLoanEligibility(loan.memberId)
        if (!eligibility.isEligible) {
            ctx.setErrorCode('INELIGIBLE');
            return { error: eligibility.message }
        }
        ctx.endStep('Eligibility Check');

        ctx.beginStep('Transition Status');
        const nextVersion = (loan.submissionVersion || 0) + 1

        const updatedLoan = await prisma.loan.update({
            where: { id: loanId },
            data: {
                status: 'PENDING_APPROVAL',
                applicationDate: new Date(),
                submissionVersion: nextVersion
            }
        })
        ctx.captureAfter(updatedLoan);
        ctx.endStep('Transition Status');

        ctx.beginStep('Post-Submission Tasks');
        await prisma.notification.create({
            data: {
                memberId: loan.memberId,
                type: NotificationType.APPLICATION_RECEIVED,
                message: `Application ${loan.loanApplicationNumber} submitted successfully (v${nextVersion}).`,
                loanId: loan.id
            }
        })

        try {
            const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
            await initiateWorkflow('LOAN', loan.id, loan.memberId, nextVersion)
        } catch (e) {
            // TODO: replace with structured logger
            console.error('[WORKFLOW_INIT_ERROR]:', e)
        }

        await prisma.loanHistory.create({
            data: {
                loanId: loan.id,
                actorName: session.user.name || 'User',
                actorRole: user?.role || 'MEMBER',
                action: 'SUBMITTED',
                version: nextVersion,
                metadata: {
                    amount: Number(loan.amount),
                    net: Number(loan.netDisbursementAmount)
                }
            }
        })

        await prisma.loanJourneyEvent.create({
            data: {
                loanId: loan.id,
                eventType: 'APPLICATION_SUBMITTED',
                description: `Loan application submitted (v${nextVersion})`,
                actorId: session.user.id,
                actorName: session.user.name || 'User',
                metadata: {
                    version: nextVersion
                }
            }
        })
        ctx.endStep('Post-Submission Tasks');

        revalidatePath('/loans')
        revalidatePath(`/loans/${loanId}`)
        return { success: true }
    }
);

/**
 * Toggle Fee Exemptions (Admin Only, APPLICATION Only)
 */
export const toggleFeeExemption = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'LOAN', apiRoute: '/api/loans/exemptions' },
    async (ctx, loanId: string, feeType: 'processingFee' | 'insuranceFee', enabled: boolean) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        const isAdmin = user?.role && ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user.role)
        if (!isAdmin) {
            ctx.setErrorCode('FORBIDDEN');
            return { error: 'Unauthorized' }
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Fetch Loan Data');
        const loan = await prisma.loan.findUnique({ where: { id: loanId } })
        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            return { error: 'Loan not found' }
        }
        if (!['APPLICATION', 'PENDING_APPROVAL'].includes(loan.status)) {
            ctx.setErrorCode('INVALID_STATUS');
            return { error: 'Exemptions can only be modified when loan is in APPLICATION or PENDING status.' }
        }
        ctx.captureBefore('Loan', loanId, loan);
        ctx.endStep('Fetch Loan Data');

        ctx.beginStep('Calculate New Fees');
        let newProcessingFee = Number(loan.processingFee)
        let newInsuranceFee = Number(loan.insuranceFee)

        const product = await prisma.loanProduct.findUnique({ where: { id: loan.loanProductId } })
        if (!product) {
            ctx.setErrorCode('PRODUCT_NOT_FOUND');
            return { error: 'Product not found' }
        }

        const { calculateLoanQualification } = await import('@/app/sacco-settings-actions')
        const appraisal = await calculateLoanQualification(loan.memberId, [], Number(loan.amount))

        const rawProcessingFee = appraisal.processingFee
        const rawInsuranceFee = appraisal.insuranceFee

        if (feeType === 'processingFee') {
            newProcessingFee = enabled ? 0 : rawProcessingFee
        } else if (feeType === 'insuranceFee') {
            newInsuranceFee = enabled ? 0 : rawInsuranceFee
        }

        const contributionDeduction = Number(loan.contributionDeduction)
        const existingOffset = Number(loan.existingLoanOffset)
        const totalDeductions = newProcessingFee + newInsuranceFee + contributionDeduction + existingOffset
        const netDisbursement = Math.max(0, Number(loan.amount) - totalDeductions)
        ctx.endStep('Calculate New Fees');

        ctx.beginStep('Update Loan');
        const updatedLoan = await prisma.loan.update({
            where: { id: loanId },
            data: {
                processingFee: newProcessingFee,
                insuranceFee: newInsuranceFee,
                totalDeductions,
                netDisbursementAmount: netDisbursement,
                feeExemptions: {
                    ...(loan.feeExemptions as object),
                    [feeType]: enabled
                }
            }
        })
        ctx.captureAfter(updatedLoan);
        ctx.endStep('Update Loan');

        revalidatePath(`/loans/${loanId}`)
        return { success: true }
    }
);
