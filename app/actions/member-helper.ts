'use server'

import { db as prisma } from "@/lib/db"

export async function getNextMemberNumber() {
    try {
        const lastMember = await prisma.member.findFirst({
            orderBy: { memberNumber: 'desc' }
        })
        const nextNumber = (lastMember?.memberNumber || 0) + 1
        return { success: true, nextNumber }
    } catch (error) {
        return { success: false, error: "Failed to fetch" }
    }
}
