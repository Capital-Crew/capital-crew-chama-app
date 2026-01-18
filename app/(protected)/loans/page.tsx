
import prisma from "@/lib/prisma"
import { LoanManagement } from "@/components/LoanManagement"

import { auth } from "@/auth"

export default async function LoansPage() {
    const session = await auth()

    // Fetch critical data
    const [loans, members, products] = await Promise.all([
        prisma.loan.findMany({
            include: {
                member: true,
                approvals: true // Include approvals for progress calculation
            },
            orderBy: { applicationDate: 'desc' }
        }),
        prisma.member.findMany({ orderBy: { name: 'asc' } }),
        prisma.loanProduct.findMany({ where: { isActive: true } })
    ])

    const memberId = (session?.user as any)?.memberId
    let creditSnapshot = null
    if (memberId) {
        const { calculateBorrowingPower } = await import('@/lib/utils/credit-limit')
        creditSnapshot = await calculateBorrowingPower(memberId).catch(() => null)
    }

    // Serialize loans to convert Decimal to number for Client Component
    const serializedLoans = loans.map((loan: any) => ({
        ...loan,
        // Serialize nested member object
        member: loan.member ? {
            ...loan.member,
            shareContributions: loan.member.shareContributions ? Number(loan.member.shareContributions) : 0
        } : loan.member,
        // Serialize loan Decimal fields
        current_balance: Number(loan.current_balance),
        outstandingBalance: loan.outstandingBalance ? Number(loan.outstandingBalance) : 0,
        amount: Number(loan.amount),
        netDisbursementAmount: Number(loan.netDisbursementAmount),
        memberSharesAtApplication: Number(loan.memberSharesAtApplication),
        grossQualifyingAmount: Number(loan.grossQualifyingAmount),
        monthlyInstallment: loan.monthlyInstallment ? Number(loan.monthlyInstallment) : 0,
        accruedInterestTotal: loan.accruedInterestTotal ? Number(loan.accruedInterestTotal) : 0,
        penaltyRate: loan.penaltyRate ? Number(loan.penaltyRate) : 0,
        interestRate: Number(loan.interestRate),
        interestRatePerMonth: loan.interestRatePerMonth ? Number(loan.interestRatePerMonth) : 0,
        penalties: loan.penalties ? Number(loan.penalties) : 0,
    }));

    // Serialize members to convert Decimal fields
    const serializedMembers = members.map((member: any) => ({
        ...member,
        shareContributions: member.shareContributions ? Number(member.shareContributions) : 0
    }));

    // Serialize products to convert Decimal fields
    const serializedProducts = products.map((product: any) => ({
        ...product,
        principal: product.principal ? Number(product.principal) : 0,
        minPrincipal: product.minPrincipal ? Number(product.minPrincipal) : 0,
        maxPrincipal: product.maxPrincipal ? Number(product.maxPrincipal) : 0,
        interestRatePerPeriod: product.interestRatePerPeriod ? Number(product.interestRatePerPeriod) : 0,
        defaultPenaltyRate: product.defaultPenaltyRate ? Number(product.defaultPenaltyRate) : 0,
    }));

    return (
        <div className="space-y-4">
            <LoanManagement
                loans={serializedLoans as any} // Cast because of Json fields
                members={serializedMembers}
                products={serializedProducts as any}
                currentUserId={session?.user?.id || ''}
                currentMemberId={memberId || ''}
                userRole={session?.user?.role || 'MEMBER'}
                creditSnapshot={creditSnapshot}
            />
        </div>
    );
}
