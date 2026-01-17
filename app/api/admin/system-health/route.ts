import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/system-health
 * 
 * Returns system health metrics for monitoring dashboard
 */
export async function GET() {
    try {
        // Count loans with and without installments
        const [loansWithInstallments, loansWithoutInstallments, totalActiveLoans] = await Promise.all([
            db.loan.count({
                where: {
                    status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] },
                    repaymentInstallments: {
                        some: {}
                    }
                }
            }),
            db.loan.count({
                where: {
                    status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] },
                    repaymentInstallments: {
                        none: {}
                    }
                }
            }),
            db.loan.count({
                where: {
                    status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
                }
            })
        ])

        const coveragePercentage = totalActiveLoans > 0
            ? Math.round((loansWithInstallments / totalActiveLoans) * 100)
            : 100

        // Get recent transaction stats for performance metrics
        const recentTransactions = await db.loanTransaction.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                health: {
                    loansWithInstallments,
                    loansWithoutInstallments,
                    totalActiveLoans,
                    coveragePercentage,
                    lastChecked: new Date()
                },
                metrics: {
                    recentTransactions24h: recentTransactions,
                    // These would be calculated from actual performance logs in production
                    avgBalanceQueryTime: 150,
                    avgDueQueryTime: 120,
                    avgRepaymentTime: 350,
                    errorRate: 0
                }
            }
        })

    } catch (error: any) {
        console.error('Error fetching system health:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch system health'
            },
            { status: 500 }
        )
    }
}
