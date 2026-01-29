
'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { auth } from '@/auth'
import { WalletService } from '@/lib/services/WalletService'
import {
    LoanStatus, ApprovalStatus, NotificationType, RepaymentFrequencyType,
    InterestType, AmortizationType, InterestCalculationPeriodType
} from '@/lib/types'
import { redirect } from 'next/navigation'
import { generateLoanApplicationNumber, generateRepaymentSchedule } from '../lib/utils'
import { calculateMonthlyInstallment } from '@/lib/loan-calculator'
import { calculateTopUpDetails, validateNetLoan } from '@/lib/topup-calculator'
import { EmailService } from '@/lib/services/EmailService'
import { PdfService } from '@/lib/services/PdfService'

export async function createMember(formData: FormData) {
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
            console.error('Failed to initiate member workflow:', error)
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
    // imports at top of this file: import { auth } -> wait, this file (app/actions.ts) DOES NOT import auth yet.
    // I need to add import { auth } from '@/auth' at the top if it's missing.
    // Let me check imports first.

    // Actually, I'll rewrite the function assuming 'auth' is available or I will add the import in a separate step if needed. 
    // But replace_file_content works on chunks. 
    // I will assume I can add the import at the top too? No, tool allows contiguous edit.
    // I will assume 'auth' needs to be imported. I'll do two edits or use multi_replace if imports are far.
    // Let's look at the file content provided earlier (Step 425). 
    // It imports 'revalidatePath' and 'prisma'. It DOES NOT import 'auth'.
    // So I need to add that import first or in parallel.
    // I will use multi_replace to do both safely.

    // WAIT. I cannot switch to multi_replace inside this tool call flow easily if I already committed to replace_file_content.
    // I will use this tool call to ONLY update the function relying on a separate step to add the import? 
    // Or I can add the import here if it's close? It's at line 4?
    // createUserAccount is at line 45. That's far.

    // I will ABORT this specific tool call and use multi_replace in the next turn? 
    // No, I can just write the logic here and assume I'll fix the import immediately after.
    // OR better: I can check if I can modify imports.

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
    const defaultPassword = "CapitalCrew@2024" // Hardcoded secure default
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

        // Create wallet for the member
        // Create wallet and Ledger Account for the member using WalletService
        // WalletService handles the transaction logic (joins existing or creates new)
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

export async function applyForLoan(prevState: any, formData: FormData) {
    const memberId = formData.get('memberId') as string
    const loanProductId = formData.get('loanProductId') as string
    const amountStr = formData.get('amount') as string
    const amount = parseFloat(amountStr)
    const contractRef = formData.get('contractRef') as string || ''
    const installments = parseInt(formData.get('installments') as string) || 12 // NEW: Custom installments
    const loanId = formData.get('loanId') as string || null // Get loanId if editing

    // Get loansToOffset (can be multiple values with same name)
    const loansToOffset = formData.getAll('loansToOffset') as string[]
    const submitAction = formData.get('submitAction') as string || 'save'

    // Parse fee exemptions if any
    const feeExemptionsStr = formData.get('feeExemptions') as string
    const feeExemptions = feeExemptionsStr ? JSON.parse(feeExemptionsStr) : {}

    // Determine Status
    const newStatus = submitAction === 'send' ? LoanStatus.PENDING_APPROVAL : LoanStatus.APPLICATION;
    const isDraft = newStatus === LoanStatus.APPLICATION;

    // Better validation with specific error messages
    if (!memberId) {
        return { error: 'To create a draft, you must at least select a Member.' }
    }
    if (!loanProductId) {
        return { error: 'To create a draft, you must at least select a Loan Product.' }
    }

    // START DRAFT LOGIC
    // If Draft, allow invalid amount (default to 0) and skip eligibility
    if (isDraft && (!amountStr || isNaN(amount) || amount <= 0)) {
        // Allow 0 or invalid amount for drafts - will be validated on submission
    } else if (!amountStr || isNaN(amount) || amount <= 0) {
        return { error: 'Missing or invalid required field: Amount. Please enter a valid loan amount greater than zero.' }
    }

    // NEW: Strict Arrears Check
    // Reuse the central eligibility logic (Frontend uses this too)
    // SKIP FOR DRAFTS
    if (!isDraft) {
        // Validate amount is reasonable (not too small)
        if (amount < 100) {
            return { error: 'Loan amount must be at least KES 100.' }
        }

        // Check if loan has defaultCheck exemption
        const existingLoan = loanId ? await prisma.loan.findUnique({
            where: { id: loanId },
            select: { feeExemptions: true }
        }) : null

        const exemptions = (existingLoan?.feeExemptions as any) || {}
        const hasDefaultCheckExemption = exemptions.defaultCheck === true

        // Only check arrears if no exemption is granted
        if (!hasDefaultCheckExemption) {
            const { checkLoanEligibility } = await import('@/app/actions/loan-eligibility')
            const eligibility = await checkLoanEligibility(memberId)

            if (!eligibility.isEligible) {
                return { error: eligibility.message || 'Application Denied: Outstanding arrears detected.' }
            }
        }
    }

    // Check for existing pending/approved applications
    // EXCLUDE the current loan being edited (if loanId is provided)
    const existingApplication = await prisma.loan.findFirst({
        where: {
            memberId,
            status: {
                in: [LoanStatus.APPLICATION, LoanStatus.PENDING_APPROVAL, LoanStatus.APPROVED]
            },
            // Exclude the current loan if editing
            ...(loanId ? { id: { not: loanId } } : {})
        }
    })

    if (existingApplication) {
        // EXEMPTION CHECK:
        // If the *existing* application has been flagged to allow concurrency (via Admin), ignore it.
        const exemptions = (existingApplication.feeExemptions as any) || {}
        if (exemptions.allowConcurrentApplication) {
            // Allow proceed
        } else {
            return { error: `You already have a loan application (${existingApplication.loanApplicationNumber} - ${existingApplication.status}) in progress. Please complete or cancel it before applying for another.` }
        }
    }

    const product = await prisma.loanProduct.findUnique({ where: { id: loanProductId } })
    if (!product) return { error: 'Invalid product' }
    if (!product.isActive) return { error: 'This loan product is currently inactive and cannot be selected.' }

    // Validate installments
    if (!isDraft && (installments < 1 || installments > product.numberOfRepayments)) {
        return { error: `Installments must be between 1 and ${product.numberOfRepayments} months` }
    }

    // Generate Loan Number ONLY if creating new
    let loanApplicationNumber = '';
    if (!loanId) {
        const lastLoan = await prisma.loan.findFirst({
            orderBy: { loanApplicationNumber: 'desc' },
            select: { loanApplicationNumber: true }
        })
        const { getNextLoanNumber } = require('../lib/utils');
        loanApplicationNumber = getNextLoanNumber(lastLoan?.loanApplicationNumber)
    }

    try {
        // Import the calculateLoanQualification function
        const { calculateLoanQualification } = await import('./sacco-settings-actions')

        // Calculate Qualification
        const appraisal = await calculateLoanQualification(
            memberId,
            loansToOffset,
            amount ? Number(amount) : 0,
            JSON.parse(JSON.stringify(feeExemptions || {}))
        )

        // Capture top-up details if offsets exist
        let topUpCalculations: any[] = []
        if (loansToOffset.length > 0) {
            // We need to fetch the actual loans to get details for the record
            const oldLoans = await prisma.loan.findMany({
                where: { id: { in: loansToOffset } },
                include: { transactions: true }
            })

            // Calculate top-up details using the same logic as calculateLoanQualification
            const { processTransactions } = await import('@/lib/statementProcessor')
            const { addMoney, truncateToDecimals, calculatePercentage } = await import('@/lib/currency')
            const saccoSettings = await prisma.saccoSettings.findFirst()
            const refinanceFeePct = Number(saccoSettings?.refinanceFeePercentage || 0)

            for (const oldLoan of oldLoans) {
                // Calculate outstanding balance
                const rawTransactions = oldLoan.transactions ? oldLoan.transactions.map((tx: any) => ({
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
                const rows = processTransactions(mappedTransactions as any[]);
                const balance = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;
                const outstandingBalance = truncateToDecimals(balance);

                // Calculate refinance fee on this loan
                const fee = calculatePercentage(outstandingBalance, refinanceFeePct);

                topUpCalculations.push({
                    loanId: oldLoan.id,
                    loanNumber: oldLoan.loanApplicationNumber,
                    productName: 'Unknown', // Need product name but simpler query above. It's fine for now or fetch it.
                    principalBalance: outstandingBalance,
                    accruedInterest: 0, // Simplified for now
                    penalties: 0,
                    refinanceFee: fee,
                    totalOffset: addMoney(outstandingBalance, fee)
                })
            }
        }

        // Generate Repayment Schedule
        const { generateRepaymentSchedule } = await import('../lib/utils')

        // Create a product variant with the custom installments if provided
        // This ensures the schedule generator uses the user-selected term
        const productForSchedule = {
            ...product,
            numberOfRepayments: installments || product.numberOfRepayments
        }

        const schedule = generateRepaymentSchedule(
            {
                amount: amount ? Number(amount) : 0,
                applicationDate: new Date()
            } as any,
            productForSchedule
        )

        const monthlyInstallment = schedule.length > 0 ? schedule[0].total : 0




        const loanIdValue = formData.get('loanId') as string;
        let loan;

        if (loanIdValue) {
            // UPDATE EXISTING LOAN
            // Do NOT update loanApplicationNumber
            loan = await prisma.loan.update({
                where: { id: loanIdValue },
                data: {
                    // loanApplicationNumber, // REMOVED
                    memberId,
                    loanProductId,
                    amount: amount || 0, // Fallback for Drafts
                    applicationDate: new Date(),


                    interestRate: product.interestRatePerPeriod,
                    status: newStatus, // Dynamic Status based on button clicked 
                    // User said "Send Approval Request sends ... to pending".
                    // So YES, it should set status to PENDING_APPROVAL.

                    // Appraisal calculation fields
                    memberSharesAtApplication: appraisal.memberShares,
                    grossQualifyingAmount: appraisal.grossQualifyingAmount,
                    processingFee: appraisal.processingFee,
                    insuranceFee: appraisal.insuranceFee,
                    shareCapitalDeduction: appraisal.shareCapitalDeduction,
                    existingLoanOffset: appraisal.selectedLoansOffset,
                    totalDeductions: appraisal.totalDeductions,
                    netDisbursementAmount: appraisal.netDisbursementAmount,

                    installments: installments || 12,
                    monthlyInstallment,
                    interestRatePerMonth: product.interestRatePerPeriod,
                    penaltyRate: product.defaultPenaltyRate || 0,

                    repaymentSchedule: JSON.parse(JSON.stringify(schedule)),
                    feeExemptions,
                    loanContract: contractRef,
                }
            });
            // Don't generate new Number if updating
        } else {
            // CREATE NEW LOAN
            loan = await prisma.loan.create({
                data: {
                    loanApplicationNumber,
                    memberId,
                    loanProductId,
                    amount: amount || 0, // Fallback
                    applicationDate: new Date(),

                    interestRate: product.interestRatePerPeriod,
                    status: newStatus, // Dynamic Status
                    // Wait, if "Send Approval Request" is clicked, it implies "Submit".
                    // If "Save & Back" is clicked, it implies "Draft".
                    // But applyForLoan is the form ACTION.
                    // The "Save & Back" button is type="submit".
                    // I need to distinguish between "Save Draft" and "Send Approval".

                    // Logic check:
                    // If the user clicks "Save & Back", we want status = APPLICATION.
                    // If the user clicks "Send Approval Request", we want status = PENDING_APPROVAL.
                    // I can use a hidden field 'actionType' or check which button was clicked (via formData).
                    // The buttons use type="submit", I can give them names/values.

                    // For now, I'll default to PENDING_APPROVAL for "Send Approval Request" as that's the main "Submit".
                    // But "Save & Back" uses the SAME action. I must differentiate.
                    // I will check for 'submitAction' field in formData.

                    memberSharesAtApplication: appraisal.memberShares,
                    grossQualifyingAmount: appraisal.grossQualifyingAmount,
                    processingFee: appraisal.processingFee,
                    insuranceFee: appraisal.insuranceFee,
                    shareCapitalDeduction: appraisal.shareCapitalDeduction,
                    existingLoanOffset: appraisal.selectedLoansOffset,
                    totalDeductions: appraisal.totalDeductions,
                    netDisbursementAmount: appraisal.netDisbursementAmount,

                    installments: installments || 12, // Fallback
                    monthlyInstallment,
                    interestRatePerMonth: product.interestRatePerPeriod,
                    penaltyRate: product.defaultPenaltyRate || 0,

                    approvalVotes: [],
                    repaymentSchedule: JSON.parse(JSON.stringify(schedule)), // Json
                    feeExemptions, // Json
                    loanContract: contractRef,
                    applicationFeePaid: false,
                }
            })
        }

        // Create LoanTopUp records for offset loans
        if (topUpCalculations.length > 0) {
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

        // Create journey event
        // Create journey event
        await prisma.loanJourneyEvent.create({
            data: {
                loanId: loan.id,
                eventType: 'APPLICATION_SUBMITTED',
                description: `Loan application submitted for KES ${amount.toLocaleString()}${loansToOffset.length > 0 ? ` (offsetting ${loansToOffset.length} loan${loansToOffset.length > 1 ? 's' : ''})` : ''}`,
                actorId: memberId,
                actorName: (await prisma.member.findUnique({ where: { id: memberId } }))?.name || 'Unknown',
                metadata: {
                    requestedAmount: amount,
                    netDisbursementAmount: appraisal.netDisbursementAmount,
                    memberShares: appraisal.memberShares,
                    loansToOffset: loansToOffset.length > 0 ? loansToOffset : undefined
                }
            }
        })

        // Note: Notifications are deferred until SUBMISSION for Drafts

        // Note: Notifications are deferred until SUBMISSION for Drafts

        // Create Approval Request if submitted directly
        if (newStatus === LoanStatus.PENDING_APPROVAL) {
            // Check if one already exists to avoid duplicates on edits
            const existingRequest = await prisma.approvalRequest.findFirst({
                where: {
                    referenceId: loan.id,
                    type: 'LOAN',
                    status: 'PENDING'
                }
            })

            if (!existingRequest) {
                try {
                    const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
                    // EntityType.LOAN is 'LOAN'
                    await initiateWorkflow('LOAN', loan.id, memberId)
                } catch (e) {
                    console.error("Failed to initiate workflow:", e)
                    // Fallback or rethrow?
                }
            }
        }

        // Email Notification (Async - Fire and Forget for now, or await if critical)
        try {
            const member = await prisma.member.findUnique({ where: { id: memberId } })
            const loanProduct = await prisma.loanProduct.findUnique({ where: { id: loanProductId } })

            if (member && loanProduct) {
                // Generate PDF
                const pdfBuffer = await PdfService.generateAppraisal(loan, member, loanProduct)

                // Send Email to Admins
                await EmailService.sendLoanAppraisal(
                    loan.id,
                    member.name,
                    `KES ${amount.toLocaleString()}`,
                    pdfBuffer
                )
            }
        } catch (emailError) {
            console.error("Failed to send submission email:", emailError)
        }

        revalidatePath('/loans')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to create loan application' }
    }
}

export async function submitVote(loanId: string, decision: ApprovalStatus, notes: string, userId: string) {
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

                // Send Approval Email to Member
                try {
                    // Need user email
                    const user = await prisma.user.findUnique({ where: { memberId: loan.memberId } })
                    const member = await prisma.member.findUnique({ where: { id: loan.memberId } })
                    const fullLoan = await prisma.loan.findUnique({
                        where: { id: loan.id },
                        include: { loanProduct: true }
                    })

                    if (user?.email && member && fullLoan) {
                        const cardPdf = await PdfService.generateAppraisal(fullLoan, member, fullLoan.loanProduct)

                        // Parse schedule from JSON if needed, or pass as is if typed correctly
                        const schedule = fullLoan.repaymentSchedule as any
                        const schedulePdf = await PdfService.generateSchedule(schedule, fullLoan.loanApplicationNumber, member.name)

                        await EmailService.sendLoanApproval(
                            user.email,
                            member.name,
                            fullLoan.loanApplicationNumber,
                            cardPdf,
                            schedulePdf
                        )
                    }
                } catch (emailError) {
                    console.error("Failed to send approval email:", emailError)
                }
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
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return

    const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
            disbursementDate: new Date(),
            cachedSchedule: null // Invalidate Cache on Disbursement
        }
    })
}

export async function createLoanProduct(formData: FormData) {
    const name = formData.get('name') as string
    const principal = parseFloat(formData.get('principal') as string)
    const rate = parseFloat(formData.get('interestRatePerPeriod') as string)
    const type = formData.get('interestType') as InterestType

    await prisma.loanProduct.create({
        data: {
            name,
            principal,
            numberOfRepayments: 12,
            repaymentEvery: 1,
            repaymentFrequencyType: RepaymentFrequencyType.MONTHS,
            interestRatePerPeriod: rate,
            interestType: type,
            interestCalculationPeriodType: InterestCalculationPeriodType.SAME_AS_REPAYMENT,
            amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
            charges: [],
            isActive: true
        }
    })
    revalidatePath('/admin/system')
}

export async function createChargeTemplate(formData: FormData) {
    const name = formData.get('name') as string
    const amount = parseFloat(formData.get('amount') as string)

    await prisma.chargeTemplate.create({
        data: {
            name,
            chargeType: 'FEE',
            calculationType: 'FIXED',
            amount,
            dueDateOffset: 0,
            isActive: true
        }
    })
    revalidatePath('/admin/system')
}

// NEW: Workflow Actions

/**
 * Submit a APPLICATION loan for approval
 */
export async function submitLoanApplication(loanId: string) {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    const user = await prisma.user.findUnique({ where: { id: session?.user?.id } }) // Need user for role in logging

    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { member: true, loanProduct: true }
    })

    if (!loan) return { error: 'Loan not found' }
    if (loan.status !== 'APPLICATION') return { error: 'Loan is not in APPLICATION status' }

    // Final Eligibility Check before locking
    const { checkLoanEligibility } = await import('@/app/actions/loan-eligibility')
    const eligibility = await checkLoanEligibility(loan.memberId)
    if (!eligibility.isEligible) {
        return { error: eligibility.message }
    }

    // Lock and Transition
    // Increment version if re-submitting (if cancellationCount > 0, we can assume it's a re-submission or version tracks attempts)
    // Actually, we should just increment version on every submit if it was previously cancelled, or just increment it blindly?
    // User requirement: "Increment submissionVersion by 1" whenever they click "Submit".
    // Since DRAFT is the state before submit, submitting moves version up.

    const nextVersion = (loan.submissionVersion || 0) + 1

    await prisma.loan.update({
        where: { id: loanId },
        data: {
            status: 'PENDING_APPROVAL',
            applicationDate: new Date(), // Reset date to submission time
            submissionVersion: nextVersion
        }
    })

    // Create Notification
    await prisma.notification.create({
        data: {
            memberId: loan.memberId,
            type: NotificationType.APPLICATION_RECEIVED,
            message: `Application ${loan.loanApplicationNumber} submitted successfully (v${nextVersion}).`,
            loanId: loan.id
        }
    })

    // Create Approval Request
    // Initiate Workflow via Engine
    try {
        const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
        await initiateWorkflow('LOAN', loan.id, loan.memberId)
    } catch (e) {
        console.error("Failed to initiate workflow:", e)
    }

    // Create LoanHistory Entry (The Audit Log)
    await prisma.loanHistory.create({
        data: {
            loanId: loan.id,
            actorName: session.user.name || 'User',
            actorRole: user?.role || 'MEMBER', // Fetch user role again if needed, or assume MEMBER if owner
            action: 'SUBMITTED',
            version: nextVersion,
            metadata: {
                amount: Number(loan.amount),
                net: Number(loan.netDisbursementAmount)
            }
        }
    })

    // Legacy Journey Event (Keep for existing timeline)
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

    revalidatePath('/loans')
    revalidatePath(`/loans/${loanId}`)
    return { success: true }
}

/**
 * Toggle Fee Exemptions (Admin Only, APPLICATION Only)
 */
export async function toggleFeeExemption(loanId: string, feeType: 'processingFee' | 'insuranceFee', enabled: boolean) {
    const session = await auth()

    // Admin Check
    const user = await prisma.user.findUnique({ where: { id: session?.user?.id } })
    const isAdmin = user?.role && ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user.role)
    if (!isAdmin) return { error: 'Unauthorized' }

    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) return { error: 'Loan not found' }

    // Strict Workflow Rule: Only editable in APPLICATION
    // Workflow Rule: Editable in APPLICATION or PENDING_APPROVAL (Admin Override)
    if (!['APPLICATION', 'PENDING_APPROVAL'].includes(loan.status)) return { error: 'Exemptions can only be modified when loan is in APPLICATION or PENDING status.' }

    // Logic: If Exemption is ENABLED, the Fee becomes 0.
    // If DISABLED, calculate the original fee from the product.

    let newProcessingFee = Number(loan.processingFee)
    let newInsuranceFee = Number(loan.insuranceFee)

    // We need to fetch the original product rates to recalculate if un-exempting
    const product = await prisma.loanProduct.findUnique({ where: { id: loan.loanProductId } })
    if (!product) return { error: 'Product not found' }

    // Re-calculate base fees
    const { calculateLoanQualification } = await import('@/app/sacco-settings-actions')
    // Re-run calc logic to get raw fees
    const appraisal = await calculateLoanQualification(loan.memberId, [], Number(loan.amount))

    const rawProcessingFee = appraisal.processingFee
    const rawInsuranceFee = appraisal.insuranceFee

    if (feeType === 'processingFee') {
        newProcessingFee = enabled ? 0 : rawProcessingFee
    } else if (feeType === 'insuranceFee') {
        newInsuranceFee = enabled ? 0 : rawInsuranceFee
    }

    // Update Loan with new fees
    // Recalculate Totals
    const shareCapital = Number(loan.shareCapitalDeduction)
    const existingOffset = Number(loan.existingLoanOffset)
    const topUpFee = 0 // Simplify for now or recalculate if stored
    const totalDeductions = newProcessingFee + newInsuranceFee + shareCapital + existingOffset + topUpFee
    const netDisbursement = Math.max(0, Number(loan.amount) - totalDeductions)

    // Update DB
    await prisma.loan.update({
        where: { id: loanId },
        data: {
            processingFee: newProcessingFee,
            insuranceFee: newInsuranceFee,
            totalDeductions,
            netDisbursementAmount: netDisbursement,

            // Store Exemption Flag in Json
            feeExemptions: {
                ...(loan.feeExemptions as object),
                [feeType]: enabled // true = exempted (0 fee)
            }
        }
    })

    // Log Action
    await prisma.auditLog.create({
        data: {
            userId: session!.user!.id!,
            action: 'FEE_EXEMPTION_CHANGED',
            details: `Updated ${feeType} exemption to ${enabled} for Loan ${loan.loanApplicationNumber} (Draft)`
        }
    })

    revalidatePath(`/loans/${loanId}`)
    return { success: true }
}
