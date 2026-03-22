'use server'

import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { AccountingEngine } from "@/lib/accounting/AccountingEngine"
import { getSystemMappingsDict } from "@/app/actions/system-accounting"


export async function getWelfareFundBalance() {
    try {
        const settings = await prisma.saccoSettings.findFirst()
        return {
            success: true,
            balance: Number(settings?.welfareCurrentBalance || 0),
            monthlyContribution: Number(settings?.welfareMonthlyContribution || 0)
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function addWelfareFundContribution(amount: number, description: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    // Only admins should create contributions
    const userRole = session.user.role
    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(userRole || '')) {
        // return { success: false, error: 'Only admins can add welfare contributions' }
    }

    try {
        if (amount <= 0) {
            return { success: false, error: 'Amount must be greater than zero' }
        }

        const settings = await prisma.saccoSettings.findFirst()
        const currentBalance = Number(settings?.welfareCurrentBalance || 0)

        // 1. Update Balance
        await prisma.saccoSettings.update({
            where: { id: settings?.id },
            data: {
                welfareCurrentBalance: { increment: amount }
            }
        })

        // 2. Create Transaction Record
        await prisma.welfareFundTransaction.create({
            data: {
                type: 'CONTRIBUTION',
                amount: amount,
                description,
                balanceAfter: currentBalance + amount,
                createdById: session.user.id
            }
        })


        revalidatePath('/welfare')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getWelfareFundTransactions() {
    try {
        const transactions = await prisma.welfareFundTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { name: true }
                }
            },
            take: 50 // Limit for now
        })
        return { success: true, data: transactions }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// For monthly automated contributions
export async function processMonthlyWelfareContribution() {
    try {
        const settings = await prisma.saccoSettings.findFirst()
        const amount = Number(settings?.welfareMonthlyContribution || 0)

        if (amount > 0) {
            // System user or first admin?
            const admin = await prisma.user.findFirst({ where: { role: 'CHAIRPERSON' } })
            if (!admin) throw new Error('No admin found to attribute contribution')

            // Reuse the add logic but internal
            const currentBalance = Number(settings?.welfareCurrentBalance || 0)

            await prisma.saccoSettings.update({
                where: { id: settings?.id },
                data: {
                    welfareCurrentBalance: { increment: amount }
                }
            })

            await prisma.welfareFundTransaction.create({
                data: {
                    type: 'CONTRIBUTION',
                    amount: amount,
                    description: `Monthly Automated Contribution`,
                    balanceAfter: currentBalance + amount,
                    createdById: admin.id
                }
            })

            return { success: true }
        }
        return { success: false, message: 'No monthly contribution set' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
