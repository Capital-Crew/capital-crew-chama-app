import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const memberNumber = searchParams.get('memberNumber')

        if (!memberNumber) {
            return NextResponse.json({ error: 'Member number is required' }, { status: 400 })
        }

        const member = await prisma.member.findFirst({
            where: {
                memberNumber: parseInt(memberNumber)
            }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found', member: null }, { status: 404 })
        }

        return NextResponse.json({ member })
    } catch (error) {
        return handleApiError(error, 'Members GET')
    }
}
