import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
    revalidateTag('rbac-permissions')
    return NextResponse.json({ success: true, message: 'RBAC Cache Cleared' })
}
