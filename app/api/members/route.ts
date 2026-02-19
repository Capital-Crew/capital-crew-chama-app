import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

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
    } catch (error: any) {
        console.error('[Members API] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
