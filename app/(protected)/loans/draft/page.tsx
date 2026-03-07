import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { LoanApplicationForm } from "@/components/loan/LoanApplicationForm"
import { calculateBorrowingPower } from "@/lib/utils/credit-limit"
import { serializeMembers } from "@/lib/serializers"

export default async function ResumeDraftPage() {
    const session = await auth()
    if (!session?.user) return redirect("/auth/login")

    // Fetch LoanDraft for current user
    const loanDraft = await db.loanDraft.findUnique({
        where: { userId: session.user.id }
    })

    // If no draft exists, redirect to loans page
    if (!loanDraft) {
        return redirect('/loans')
    }

    // Fetch dependencies for form
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

    // SECURITY: Validate draft belongs to current user's member
    // If draft has a different memberId, delete it and redirect to new application
    if (loanDraft.data && typeof loanDraft.data === 'object') {
        const draftMemberId = (loanDraft.data as any).memberId
        if (draftMemberId && draftMemberId !== currentMemberId) {

            // Delete the invalid draft
            await db.loanDraft.delete({
                where: { userId: session.user.id }
            })

            // Redirect to create new application
            return redirect('/loans/apply')
        }
    }

    // Calculate credit snapshot
    let creditSnapshot = null
    if (currentMemberId) {
        try {
            creditSnapshot = await calculateBorrowingPower(currentMemberId)
        } catch (e) {
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
                    Resume Your <span className="text-cyan-600">Application</span>
                </h1>
                <p className="text-slate-500 text-sm">
                    Continue where you left off. Your progress is auto-saved.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8">
                <LoanApplicationForm
                    members={serializeMembers(members)}
                    products={serializedProducts as any}
                    currentMemberId={currentMemberId}
                    creditSnapshot={creditSnapshot}
                    draftData={loanDraft.data}
                    initialData={undefined}
                />
            </div>
        </div>
    )
}

