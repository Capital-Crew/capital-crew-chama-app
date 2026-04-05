'use server'

import { db } from "@/lib/db"
import { InterestService } from "@/services/interest-engine"
import { revalidatePath } from "next/cache"
import { serializeFinancials } from "@/lib/safe-serialization"

export async function getInterestRuns() {
    try {
        const runs = await db.interestEngineRun.findMany({
            orderBy: { startedAt: 'desc' },
            include: {
                _count: {
                    select: { postings: true, transactions: true }
                }
            }
        })
        return serializeFinancials(runs)
    } catch (error: any) {
        console.error("[InterestActions] getInterestRuns failed:", error)
        return []
    }
}

export async function getRunDetails(runId: string) {
    try {
        const run = await db.interestEngineRun.findUnique({
            where: { id: runId },
            include: {
                postings: {
                    include: {
                        loan: {
                            select: {
                                loanApplicationNumber: true,
                                member: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        })
        return serializeFinancials(run)
    } catch (error: any) {
        return null
    }
}

export async function reverseInterestRun(runId: string) {
    try {
        const result = await InterestService.reverseBatchRun(runId)
        revalidatePath('/admin/system/engine-health')
        return { success: true }
    } catch (error: any) {
        console.error(`[InterestActions] reverseInterestRun failed for ${runId}:`, error)
        return { success: false, error: error.message }
    }
}

export async function triggerInterestBatch() {
    try {
        const results = await InterestService.processMonthlyBatch()
        revalidatePath('/admin/system/engine-health')
        return { success: true, results }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
