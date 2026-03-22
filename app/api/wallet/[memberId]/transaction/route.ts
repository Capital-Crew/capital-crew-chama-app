import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json({ error: 'Endpoint deprecated in favor of AccountingEngine server actions.' }, { status: 501 })
}
