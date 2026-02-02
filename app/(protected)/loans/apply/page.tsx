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

    // DEBUG: Log to help diagnose the issue
    console.log('=== LOAN APPLICATION DEBUG ===')
    console.log('Session User ID:', session.user.id)
    console.log('Session User Email:', session.user.email)
    console.log('Session User Name:', session.user.name)
    console.log('Database User:', {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        memberId: user?.memberId
    })
    console.log('Linked Member:', {
        id: user?.member?.id,
        name: user?.member?.name,
        memberNumber: user?.member?.memberNumber
    })
    console.log('currentMemberId being passed to form:', currentMemberId)
    console.log('===========================')

    // VALIDATION: Ensure user has a member profile
    if (!currentMemberId) {
        return (
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <h3 className="text-red-800 font-black text-lg uppercase mb-2">Member Profile Required</h3>
                            <p className="text-red-700 text-sm leading-relaxed mb-3">
                                Your user account is not linked to a member profile. You must have a member profile to apply for loans.
                            </p>
                            <p className="text-red-600 text-xs">
                                Please contact the system administrator to link your account to a member profile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

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

