
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '../lib/prisma'
import {
    LoanStatus, ApprovalStatus, NotificationType, RepaymentFrequencyType,
    InterestType, AmortizationType, InterestCalculationPeriodType
} from '@/lib/types'
import { redirect } from 'next/navigation'
import { generateLoanApplicationNumber, generateRepaymentSchedule } from '../lib/utils'

export async function createMember(formData: FormData) {
    const name = formData.get('name') as string
    const contact = formData.get('contact') as string

    // Generate member number
    const lastMember = await prisma.member.findFirst({ orderBy: { memberNumber: 'desc' } })
    const memberNumber = (lastMember?.memberNumber || 0) + 1

    const member = await prisma.member.create({
        data: {
            name,
            contact,
            memberNumber,
        },
    })

    // Create notification
    await prisma.notification.create({
        data: {
            memberId: member.id,
            type: NotificationType.SYSTEM_UPDATE,
            message: `Welcome onboard, ${member.name}!`,
        }
    })

    revalidatePath('/members')
    revalidatePath('/dashboard')
    return member
}

export async function applyForLoan(prevState: any, formData: FormData) {
    const memberId = formData.get('memberId') as string
    const loanProductId = formData.get('loanProductId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const contractRef = formData.get('contractRef') as string || ''

    if (!memberId || !loanProductId || !amount) {
        return { error: 'Missing required fields' }
    }

    const product = await prisma.loanProduct.findUnique({ where: { id: loanProductId } })
    if (!product) return { error: 'Invalid product' }

    // Generate Loan Number
    const loans = await prisma.loan.findMany({ select: { loanApplicationNumber: true } })
    const loanApplicationNumber = generateLoanApplicationNumber(loans as any)

    // Calculate schedule
    const tempLoan = { amount, applicationDate: new Date().toISOString() }
    const schedule = generateRepaymentSchedule(tempLoan, product as any)
    const dueDate = schedule[schedule.length - 1]?.dueDate ? new Date(schedule[schedule.length - 1].dueDate) : new Date()

    const feeExemptions = {
        applicationFee: false, rescheduleFee: false, topUpFee: false, penaltyFee: false
    }

    try {
        const loan = await prisma.loan.create({
            data: {
                loanApplicationNumber,
                memberId,
                loanProductId,
                amount,
                applicationDate: new Date(),
                dueDate,
                interestRate: product.interestRatePerPeriod,
                status: LoanStatus.PENDING_APPROVAL,
                approvalVotes: [], // Json
                repaymentSchedule: JSON.parse(JSON.stringify(schedule)), // Json
                feeExemptions, // Json
                loanContract: contractRef,
                applicationFeePaid: false,
            }
        })

        await prisma.notification.create({
            data: {
                memberId,
                type: NotificationType.APPLICATION_RECEIVED,
                message: `Application ${loanApplicationNumber} received for review.`,
                loanId: loan.id
            }
        })

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

    await prisma.loan.update({
        where: { id: loanId },
        data: {
            disbursementDate: new Date(),
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
    revalidatePath('/settings')
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
    revalidatePath('/settings')
}
