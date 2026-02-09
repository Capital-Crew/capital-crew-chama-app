import { db } from '@/lib/db'
import { auth } from '@/auth'
import { LoanStatus, Prisma } from '@prisma/client'
import { getRiskBucket } from '@/lib/reporting-utils'
import { differenceInDays } from 'date-fns'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as LoanStatus | null
    const memberId = searchParams.get('memberId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minArrears = searchParams.get('minArrears') ? parseFloat(searchParams.get('minArrears')!) : 0

    // 2. Build Where Clause
    const where: Prisma.LoanWhereInput = {}
    if (status) where.status = status
    if (memberId) where.memberId = memberId
    if (startDate || endDate) {
        where.disbursementDate = {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
        }
    }

    // 3. Fetch Data in chunks to handle thousands of rows efficiently
    const loans = await db.loan.findMany({
        where,
        select: {
            id: true,
            loanApplicationNumber: true,
            amount: true,
            outstandingBalance: true,
            dueDate: true,
            status: true,
            member: {
                select: {
                    name: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // 4. Construct CSV
    const headers = ['Member Name', 'Loan App #', 'Loan Amount', 'Balance', 'Due Date', 'Days Late', 'Risk Bucket', 'Status']
    const csvRows = [headers.join(',')]

    loans.forEach(loan => {
        const today = new Date()
        const dueDate = loan.dueDate ? new Date(loan.dueDate) : null
        let daysLate = 0
        if (dueDate && dueDate < today && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE' || loan.status === 'DISBURSED')) {
            daysLate = differenceInDays(today, dueDate)
        }

        const riskBucket = getRiskBucket(daysLate)

        const row = [
            `"${loan.member?.name || 'N/A'}"`,
            `"${loan.loanApplicationNumber}"`,
            loan.amount?.toString() || '0',
            loan.outstandingBalance?.toString() || '0',
            loan.dueDate ? loan.dueDate.toISOString().split('T')[0] : 'N/A',
            daysLate.toString(),
            `"${riskBucket}"`,
            `"${loan.status}"`
        ]
        csvRows.push(row.join(','))
    })

    const csvString = csvRows.join('\n')

    // 5. Return Response
    return new NextResponse(csvString, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="loan_portfolio_report_${new Date().toISOString().split('T')[0]}.csv"`
        }
    })
}
