
import { serializeMember, serializeMembers } from "@/lib/serializers"
import { db as prisma } from "@/lib/db"
import { LoanManagement } from "@/components/LoanManagement"

import { auth } from "@/auth"
import { protectPage } from "@/lib/with-module-protection"
import { redirect } from "next/navigation"

export default async function LoansPage() {
    const session = await auth()

    if (!session?.user) redirect('/login')
    if (!await protectPage('LOANS')) return redirect('/dashboard')

    // Fetch critical data
    const [loans, members, products, loanDraft] = await Promise.all([
        prisma.loan.findMany({
            include: {
                member: true,
                approvals: true // Include approvals for progress calculation
            },
            orderBy: { applicationDate: 'desc' }
        }),
        prisma.member.findMany({ orderBy: { name: 'asc' } }),
        prisma.loanProduct.findMany({ where: { isActive: true } }),
        // Fetch LoanDraft for current user
        session?.user?.id
            ? prisma.loanDraft.findUnique({ where: { userId: session.user.id } })
            : Promise.resolve(null)
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
        // Serialize nested member object using our new helper
        member: loan.member ? serializeMember(loan.member) : loan.member,
        // Serialize loan Decimal fields
        current_balance: Number(loan.current_balance || 0),
        outstandingBalance: Number(loan.outstandingBalance || 0),
        amount: Number(loan.amount || 0),
        netDisbursementAmount: Number(loan.netDisbursementAmount || 0),
        memberSharesAtApplication: Number(loan.memberSharesAtApplication || 0),
        grossQualifyingAmount: Number(loan.grossQualifyingAmount || 0),
        monthlyInstallment: Number(loan.monthlyInstallment || 0),
        accruedInterestTotal: Number(loan.accruedInterestTotal || 0),
        penaltyRate: Number(loan.penaltyRate || 0),
        interestRate: Number(loan.interestRate || 0),
        interestRatePerMonth: Number(loan.interestRatePerMonth || 0),
        penalties: Number(loan.penalties || 0),
        // Fix for missing items
        processingFee: Number(loan.processingFee || 0),
        insuranceFee: Number(loan.insuranceFee || 0),
        shareCapitalDeduction: Number(loan.shareCapitalDeduction || 0),
        existingLoanOffset: Number(loan.existingLoanOffset || 0),
        totalDeductions: Number(loan.totalDeductions || 0),
    }));

    // Serialize members to convert Decimal fields
    const serializedMembers = serializeMembers(members);

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
                members={serializedMembers as any}
                products={serializedProducts as any}
                currentUserId={session?.user?.id || ''}
                currentMemberId={memberId || ''}
                userRole={session?.user?.role || 'MEMBER'}
                creditSnapshot={creditSnapshot}
                loanDraft={loanDraft}
            />
        </div>
    );
}
