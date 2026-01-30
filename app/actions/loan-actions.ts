'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'

/**
 * Get count of loans pending approval
 * Lightweight query using Prisma count
 */
export async function getPendingLoanCount() {
    const session = await auth()
    if (!session?.user) return 0

    // Permission check can be added here if needed, but for count it's generally safe
    // Ideally check if user has APPROVE_LOANS permission to see the badge
    const canApprove = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(session.user.role)

    if (!canApprove) return 0

    try {
        const count = await db.loan.count({
            where: {
                status: 'PENDING_APPROVAL'
            }
        })
        return count
    } catch (error) {
        console.error('Error fetching pending loan count:', error)
        return 0
    }
}

/**
 * Get list of pending loans for decision card
 */
export async function getPendingLoans() {
    const session = await auth()
    if (!session?.user) return []

    // Strict permission check for viewing full list
    const canApprove = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(session.user.role)
    if (!canApprove) return []

    try {
        const loans = await db.loan.findMany({
            where: {
                status: 'PENDING_APPROVAL'
            },
            select: {
                id: true,
                loanApplicationNumber: true,
                amount: true,
                applicationDate: true,
                member: {
                    select: {
                        name: true,
                        memberNumber: true,
                        details: {
                            select: {
                                image: false // Ensure we don't break if field missing
                            }
                        }
                    }
                },
                loanProduct: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                applicationDate: 'desc'
            }
        })

        // Map to simpler structure if needed, or return as is
        return loans.map(loan => ({
            id: loan.id,
            loanNo: loan.loanApplicationNumber,
            applicantName: loan.member.name,
            amount: Number(loan.amount), // Convert Decimal to Number
            date: loan.applicationDate,
            productName: loan.loanProduct.name
        }))
    } catch (error) {
        console.error('Error fetching pending loans:', error)
        return []
    }
}
