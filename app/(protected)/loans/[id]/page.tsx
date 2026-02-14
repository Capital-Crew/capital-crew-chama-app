
import { auth } from '@/auth'
import { getLoanDetails } from '@/app/actions/loan'
import { notFound } from 'next/navigation'
import { LoanDetailsView } from '@/components/loans/LoanDetailsView'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LoanDetailsPage({ params }: PageProps) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        // Handle unauthorized (redirect or error)
        return <div>Unauthorized</div>
    }

    const loan = await getLoanDetails(id)

    if (!loan) {
        return notFound()
    }

    // Map transactions: Prefer Strict Ledger (transactions), fallback to Wallet Ledger (walletTransactions)
    const transactions = (loan.transactions && loan.transactions.length > 0)
        ? loan.transactions.map((tx: any) => ({
            id: tx.id,
            loanNo: loan.loanApplicationNumber,
            loanId: loan.id,
            postingDate: tx.postedAt || tx.createdAt,
            createdAt: tx.createdAt,
            entryType: tx.type, // 'PRINCIPAL', 'INTEREST', etc.
            description: tx.description,
            amount: tx.amount,
            principalAmount: Number(tx.principalAmount || 0),
            interestAmount: Number(tx.interestAmount || 0),
            penaltyAmount: Number(tx.penaltyAmount || 0),
            feeAmount: Number(tx.feeAmount || 0),
            glCode: '1000-00', // Placeholder until strictly mapped
            userId: tx.userId,
            user: { name: 'System' },
            isReversed: tx.isReversed
        }))
        : loan.walletTransactions?.map((tx: any) => ({
            id: tx.id,
            loanNo: loan.loanApplicationNumber,
            loanId: loan.id,
            postingDate: tx.createdAt,
            createdAt: tx.createdAt,
            entryType: tx.type || 'REPAYMENT',
            description: tx.description,
            amount: tx.amount,
            principalAmount: 0,
            interestAmount: 0,
            penaltyAmount: 0,
            feeAmount: 0,
            glCode: '1000-00',
            userId: tx.wallet?.member?.userId,
            user: tx.wallet?.member?.user || { name: 'System' }
        })) || []

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/loans" className="text-sm text-slate-500 hover:text-teal-600 mb-1 inline-block">
                        &larr; Back to Portfolio
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Loan #{loan.loanApplicationNumber}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {loan.member?.name} &bull; {loan.loanProduct?.name}
                    </p>
                </div>
                <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${loan.status === 'ACTIVE' ? 'bg-teal-100 text-teal-800' :
                        loan.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {loan.status}
                    </span>
                </div>
            </div>

            {/* Main Content: Client View */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
                <LoanDetailsView
                    loan={loan}
                    transactions={transactions}
                />
            </div>
        </div>
    )
}
