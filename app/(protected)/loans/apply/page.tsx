import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { LoanApplicationForm } from "@/components/loan/LoanApplicationForm"
import { calculateBorrowingPower } from "@/lib/utils/credit-limit"
import { serializeMembers } from "@/lib/serializers"

export default async function NewLoanApplicationPage() {
    const session = await auth()
    if (!session?.user) return redirect("/auth/login")

    // Check for existing LoanDraft
    const loanDraft = await db.loanDraft.findUnique({
        where: { userId: session.user.id }
    })

    // If draft exists, redirect to resume page
    if (loanDraft) {
        return redirect('/loans/draft')
    }

    // Fetch dependencies
    const [members, products] = await Promise.all([
        db.member.findMany({ orderBy: { name: 'asc' } }),
        db.loanProduct.findMany({ where: { isActive: true } })
    ])

    // Get user's member ID
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    const currentMemberId = user?.memberId || ''

    // Calculate credit snapshot
    let creditSnapshot = null
    if (currentMemberId) {
        try {
            creditSnapshot = await calculateBorrowingPower(currentMemberId)
        } catch (e) {
            console.error("Failed to calc credit", e)
        }
    }

    // Serialize products
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
                    New Loan <span className="text-cyan-600">Application</span>
                </h1>
                <p className="text-slate-500 text-sm">
                    Fill in the details below. Your progress is auto-saved.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8">
                <LoanApplicationForm
                    members={serializeMembers(members)}
                    products={serializedProducts as any}
                    currentMemberId={currentMemberId}
                    creditSnapshot={creditSnapshot}
                    draftData={undefined}
                    initialData={undefined}
                />
            </div>
        </div>
    )
}
