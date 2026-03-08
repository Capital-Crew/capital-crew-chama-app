import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { protectPage } from "@/lib/with-module-protection"
import { LoanApplicationForm } from "@/components/loan/LoanApplicationForm" // Correct path
import { CreditSnapshot, calculateBorrowingPower } from "@/lib/utils/credit-limit"
import { serializeMembers } from "@/lib/serializers"

interface PageProps {
    params: {
        loanId: string
    }
}

export default async function LoanDraftPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user) return redirect("/auth/login")
    if (!await protectPage('LOANS')) return redirect('/dashboard')

    // Await params for Next.js 15+
    const { loanId } = await params

    // Fetch Loan
    const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
            loanProduct: true,
            // Include other relations if needed for the form
        }
    })

    if (!loan) return notFound()

    // Verify Ownership (or Admin)
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    const isOwner = loan.memberId === user?.memberId
    const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(user?.role || '')

    if (!isOwner && !isAdmin) {
        return redirect("/dashboard?error=Unauthorized")
    }

    const canEditDetails = isOwner
    const canEditExemptions = isOwner || isAdmin

    // Check Status - Redirect if not Draft/Application
    // Actually, maybe we want to view it in read-only if pending? 
    // But for now, this page is for EDITING.
    if (loan.status !== 'APPLICATION' && loan.status !== 'DRAFT') { // DRAFT added to enum
        // If pending, maybe redirect to a view page? 
        // For now, redirect to main loans list
        return redirect(`/loans?highlight=${loanId}`)
    }

    // Fetch Dependencies for Form
    const [members, products] = await Promise.all([
        db.member.findMany({ orderBy: { name: 'asc' } }),
        db.loanProduct.findMany({ where: { isActive: true } })
    ])

    // Calculate Credit Snapshot
    let creditSnapshot: CreditSnapshot | null = null
    if (loan.memberId) {
        try {
            creditSnapshot = await calculateBorrowingPower(loan.memberId)
        } catch (e) {
        }
    }

    // Serialize for Client Component
    const serializedLoan = {
        ...loan,
        amount: Number(loan.amount || 0),
        current_balance: Number(loan.current_balance || 0),
        outstandingBalance: Number(loan.outstandingBalance || 0),
        interestRate: Number(loan.interestRate || 0),
        penalties: Number(loan.penalties || 0),
        // ... other decimals
        memberSharesAtApplication: Number(loan.memberSharesAtApplication || 0),
        grossQualifyingAmount: Number(loan.grossQualifyingAmount || 0),
        processingFee: Number(loan.processingFee || 0),
        insuranceFee: Number(loan.insuranceFee || 0),
        shareCapitalDeduction: Number(loan.shareCapitalDeduction || 0),
        existingLoanOffset: Number(loan.existingLoanOffset || 0),
        totalDeductions: Number(loan.totalDeductions || 0),
        netDisbursementAmount: Number(loan.netDisbursementAmount || 0),
        monthlyInstallment: Number(loan.monthlyInstallment || 0),
        interestRatePerMonth: Number(loan.interestRatePerMonth || 0),
        penaltyRate: Number(loan.penaltyRate || 0),
        accruedInterestTotal: Number(loan.accruedInterestTotal || 0),
    }

    const serializedProducts = products.map((p: any) => ({
        ...p,
        principal: Number(p.principal),
        minPrincipal: Number(p.minPrincipal),
        maxPrincipal: Number(p.maxPrincipal),
        interestRatePerPeriod: Number(p.interestRatePerPeriod),
        defaultPenaltyRate: Number(p.defaultPenaltyRate),
    }))

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                    Edit Application: <span className="text-cyan-600">{loan.loanApplicationNumber}</span>
                </h1>
                <p className="text-slate-500 text-sm">
                    Complete your loan details below. Your progress is auto-saved.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8">
                <LoanApplicationForm
                    members={serializeMembers(members)}
                    products={serializedProducts as any}
                    currentMemberId={loan.memberId}
                    creditSnapshot={creditSnapshot}
                    initialData={serializedLoan as any}
                    canEditDetails={canEditDetails}
                    canEditExemptions={canEditExemptions}
                />
            </div>
        </div>
    )
}
