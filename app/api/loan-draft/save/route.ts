import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

/**
 * API endpoint for navigator.sendBeacon unmount saves
 * Handles loan draft saves with loanType and step tracking
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await request.json()
        const { formData, loanType, step = 1 } = payload

        if (!formData || typeof formData !== 'object') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        // Upsert the draft
        await db.loanDraft.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                data: formData,
                loanType,
                step
            },
            update: {
                data: formData,
                loanType,
                step,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in beacon save:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to save' },
            { status: 500 }
        )
    }
}
