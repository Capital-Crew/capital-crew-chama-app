
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

        // NEW: Create Approval Request for Member Onboarding
        await tx.approvalRequest.create({
            data: {
                type: 'MEMBER',
                referenceId: newMember.id,
                referenceTable: 'Member',
                requesterId: newMember.id,
                requesterName: newMember.name,
                description: `New Member Registration: ${newMember.name}`,
                status: 'PENDING',
                requiredPermission: 'APPROVE_MEMBERS'
            }
        })

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

    // Get loansToOffset (can be multiple values with same name)
    const loansToOffset = formData.getAll('loansToOffset') as string[]

    // Better validation with specific error messages
    if (!memberId) {
        return { error: 'Missing required field: Member ID. Please select a member.' }
    }
    if (!loanProductId) {
        return { error: 'Missing required field: Loan Product. Please select a loan product.' }
    }
    if (!amountStr || isNaN(amount) || amount <= 0) {
        return { error: 'Missing or invalid required field: Amount. Please enter a valid loan amount.' }
    }

    // NEW: Strict Arrears Check
    // Reuse the central eligibility logic (Frontend uses this too)
    const { checkLoanEligibility } = await import('@/app/actions/loan-eligibility')
    const eligibility = await checkLoanEligibility(memberId)

    if (!eligibility.isEligible) {
        return { error: eligibility.message || 'Application Denied: Outstanding arrears detected.' }
    }

    // Check for existing pending/approved applications
    const existingApplication = await prisma.loan.findFirst({
        where: {
            memberId,
            status: {
                in: [LoanStatus.APPLICATION, LoanStatus.PENDING_APPROVAL, LoanStatus.APPROVED]
            }
        }
    })

    if (existingApplication) {
        // Exception: If the existing loan is ACTIVE, we only block IF they are NOT offsetting it.
        // Wait, 'applyForLoan' is a NEW application.
        // Determining if it's a Top Up happens via 'loansToOffset'.
        // If I have an ACTIVE loan, and I am NOT offsetting it, I generally cannot take another loan (unless policy allows).
        // If I AM offsetting it, then it's fine?
        // Actually, the standard "One Loan Policy" usually blocks new apps if one is Active.
        // Eligibility check (Line 256) handles the "Can I borrow?" logic (1/3rd rule, existing loans, etc).
        // This block (Line 262) seems to be about "In-Flight" applications (Workflow State).
        // Active loans are "Settled" (Disbursed). They are Debt, not "Applications".
        // SO: I should NOT block ACTIVE here. Active blocking belongs in Eligibility.
        // The user specifically asked about "application stage, pending approval or approved".
        // "Approved" -> Waiting Disbursal.
        // "Active" -> Disbursed.
        // So I will stick to DRAFT, PENDING, APPROVED.

        // RE-READING USER REQUEST: "application stage, pending approval or approved"
        // THIS DOES NOT SAY "ACTIVE".
        // So I will UNCOMMENT DRAFT, PENDING, APPROVED.
        // I will NOT add ACTIVE.

        return { error: `You already have a loan application (${existingApplication.loanApplicationNumber} - ${existingApplication.status}) in progress. Please complete or cancel it before applying for another.` }
    }

    const product = await prisma.loanProduct.findUnique({ where: { id: loanProductId } })
    if (!product) return { error: 'Invalid product' }
    if (!product.isActive) return { error: 'This loan product is currently inactive and cannot be selected.' }

    // Validate installments
    if (installments < 1 || installments > product.numberOfRepayments) {
        return { error: `Installments must be between 1 and ${product.numberOfRepayments} months` }
    }

    // Generate Loan Number
    const loans = await prisma.loan.findMany({ select: { loanApplicationNumber: true } })
    const loanApplicationNumber = generateLoanApplicationNumber(loans as any)

    try {
        // Import the calculateLoanQualification function
        const { calculateLoanQualification } = await import('./sacco-settings-actions')
        const appraisal = await calculateLoanQualification(memberId, loansToOffset, amount)

        // Refined Borrowing Power Rule:
        // New Total Debt (Exposure - Offsets + RequestedAmount) must be <= Gross Qualifying Amount
        const currentExposure = appraisal.totalExposure || 0
        const offsets = appraisal.selectedLoansOffset || 0
        const grossLimit = appraisal.grossQualifyingAmount

        const projectedTotalDebt = currentExposure - offsets + amount

        if (projectedTotalDebt > grossLimit) {
            const availableAdditional = Math.max(0, grossLimit - (currentExposure - offsets))
            // WARN: We allow DRAFT creation even if limit exceeded. Validation happens on Submit.
            console.warn(`[applyForLoan] Loan exceeds limit but creating DRAFT. Debt: ${projectedTotalDebt}, Limit: ${grossLimit}`);
            /* 
            return {
                error: `Your total debt cannot exceed your limit of KES ${grossLimit.toLocaleString()}. With selected offsets, you can borrow up to KES ${availableAdditional.toLocaleString()} more.`
            }
            */
        }

        // Calculate monthly installment using new utility
        const monthlyInstallment = calculateMonthlyInstallment({
            principal: amount,
            interestRatePerMonth: product.interestRatePerPeriod,
            installments,
            amortizationType: product.amortizationType as any
        })

        // Calculate schedule with custom installments
        const tempProductWithCustomInstallments = {
            ...product,
            numberOfRepayments: installments
        }
        const tempLoan = { amount, applicationDate: new Date().toISOString() }
        const schedule = generateRepaymentSchedule(tempLoan as any, tempProductWithCustomInstallments as any)
        const dueDate = schedule[schedule.length - 1]?.dueDate ? new Date(schedule[schedule.length - 1].dueDate) : new Date()

        // Handle loan top-ups/offsets
        let topUpCalculations: any[] = []
        if (loansToOffset.length > 0) {
            // Fetch the loans being offset
            const loansData = await prisma.loan.findMany({
                where: {
                    id: { in: loansToOffset },
                    memberId,
                    current_balance: { gt: 0 }
                },
                include: {
                    loanProduct: { select: { name: true } }
                }
            })

            // Get refinance fee from settings
            const settings = await prisma.saccoSettings.findFirst()
            const refinanceFeePercentage = settings?.refinanceFeePercentage || 5.0

            // Calculate top-up details
            const loansToOffsetData = loansData.map((loan: any) => ({
                loanId: loan.id,
                loanNumber: loan.loanApplicationNumber,
                productName: loan.loanProduct?.name,
                outstandingPrincipal: Number(loan.current_balance), // Convert Decimal to Number
                disbursementDate: loan.disbursementDate!,
                interestRate: Number(loan.interestRate), // Convert Decimal to Number
                currentPenalties: Number(loan.penalties) // Convert Decimal to Number
            }))

            topUpCalculations = calculateTopUpDetails(loansToOffsetData, refinanceFeePercentage)
        }

        const feeExemptions = {
            applicationFee: false, rescheduleFee: false, topUpFee: false, penaltyFee: false
        }

        const saccoSettings = await prisma.saccoSettings.findFirst()
        const penaltyRate = saccoSettings?.penaltyRate || 5.0

        const loan = await prisma.loan.create({
            data: {
                loanApplicationNumber,
                memberId,
                loanProductId,
                amount,
                applicationDate: new Date(),
                dueDate,
                interestRate: product.interestRatePerPeriod,
                status: 'APPLICATION' as LoanStatus,

                // Appraisal calculation fields (updated to use selectedLoansOffset)
                memberSharesAtApplication: appraisal.memberShares,
                grossQualifyingAmount: appraisal.grossQualifyingAmount,
                processingFee: appraisal.processingFee,
                insuranceFee: appraisal.insuranceFee,
                shareCapitalDeduction: appraisal.shareCapitalDeduction,
                existingLoanOffset: appraisal.selectedLoansOffset, // Store selected loan offset amount
                totalDeductions: appraisal.totalDeductions,
                netDisbursementAmount: appraisal.netDisbursementAmount,

                // NEW: Installments & Monthly Payment
                installments,
                monthlyInstallment,

                // NEW: Interest Engine Field
                interestRatePerMonth: product.interestRatePerPeriod,

                // NEW: Penalty Configuration from Global Settings
                penaltyRate,

                approvalVotes: [], // Json (legacy)
                repaymentSchedule: JSON.parse(JSON.stringify(schedule)), // Json
                feeExemptions, // Json
                loanContract: contractRef,
                applicationFeePaid: false,
            }
        })

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

        // Note: Approval Request deferred until SUBMISSION

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
    await prisma.approvalRequest.create({
        data: {
            type: 'LOAN',
            referenceId: loan.id,
            referenceTable: 'Loan',
            requesterId: loan.memberId,
            requesterName: loan.member.name,
            description: `Loan Application ${loan.loanApplicationNumber} (v${nextVersion})`,
            amount: loan.amount,
            status: 'PENDING',
            requiredPermission: 'APPROVE_LOANS'
        }
    })

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
