
import { getLoanDetails } from '@/app/actions/loan'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LoanDetailsPage({ params }: PageProps) {
    const { id } = await params
    const loan = await getLoanDetails(id)

    if (!loan) {
        return notFound()
    }

    const member = loan.member
    const product = loan.loanProduct

    // Calculate Progress
    const paid = loan.amount - loan.current_balance
    const progress = Math.min(100, Math.max(0, (paid / loan.amount) * 100))

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb / Back Navigation */}
            <div className="mb-6 flex items-center text-sm text-slate-500">
                <Link href={`/members/${member.id}`} className="hover:text-teal-600 hover:underline">
                    &larr; Back to Member Profile
                </Link>
                <span className="mx-2">/</span>
                <span className="font-semibold text-slate-700">{loan.loanApplicationNumber}</span>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                    <p className="text-slate-500">Loan #{loan.loanApplicationNumber} • Disbursed {format(new Date(loan.disbursementDate || loan.createdAt), 'dd MMM yyyy')}</p>
                </div>
                <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide
                        ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            loan.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                loan.status === 'CLEARED' ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-700'}
                     `}>
                        {loan.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Financials */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Balance Card */}
                    <div className="bg-white border boundary-slate-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Repayment Progress</h2>

                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <p className="text-3xl font-bold text-slate-900">{Math.round(progress)}% <span className="text-lg text-slate-400 font-normal">Repaid</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Outstanding Balance</p>
                                <p className="text-xl font-bold text-teal-600">KES {new Intl.NumberFormat('en-KE').format(loan.current_balance)}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-6">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${loan.status === 'OVERDUE' ? 'bg-red-500' : 'bg-teal-500'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-50 pt-6">
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Principal</p>
                                <p className="font-semibold text-slate-700">{new Intl.NumberFormat('en-KE').format(loan.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Interest Rate</p>
                                <p className="font-semibold text-slate-700">{loan.interestRate}% <span className="text-[10px] text-slate-400">p.m</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Installments</p>
                                <p className="font-semibold text-slate-700">{loan.installments || 12} Months</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History (Mini) */}
                    <div className="bg-white border boundary-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">Recent Transactions</h3>
                            <Link href="#" className="text-xs text-teal-600 font-medium hover:underline">View Full Statement</Link>
                        </div>
                        <table className="min-w-full divide-y divide-slate-100">
                            <tbody className="divide-y divide-slate-50">
                                {loan.walletTransactions && loan.walletTransactions.length > 0 ? (
                                    loan.walletTransactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-sm text-slate-600">
                                                {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-slate-800">
                                                {tx.description}
                                            </td>
                                            <td className={`px-6 py-3 text-sm font-bold text-right ${tx.amount < 0 ? 'text-slate-900' : 'text-teal-600'
                                                }`}>
                                                {new Intl.NumberFormat('en-KE').format(Math.abs(tx.amount))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                                            No recent transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Actions & Details */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Action Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            {/* DRAFT SUBMISSION ACTION */}
                            {loan.status === 'APPLICATION' && (
                                <form action={async () => {
                                    'use server'
                                    const { submitLoanApplication } = await import('@/app/actions')
                                    const result = await submitLoanApplication(loan.id)
                                    // Handle result? Since this is a server component form action, it might not show toast.
                                    // Better to use a client component wrapper or just a simple form action that revalidates?
                                    // For now, simple form action.
                                }}>
                                    <button className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-xl shadow-cyan-500/20 hover:bg-cyan-700 hover:shadow-cyan-500/40 transition flex items-center justify-center gap-2 animate-pulse">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Submit Application
                                    </button>
                                </form>
                            )}

                            {loan.status === 'ACTIVE' && (
                                <button className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-teal-700 transition flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Record Repayment
                                </button>
                            )}
                            <button className="w-full bg-white border border-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg hover:bg-slate-50 transition">
                                Download Statement
                            </button>
                            {/* Only if eligible */}
                            <button className="w-full bg-white border border-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg hover:bg-slate-50 transition">
                                Top-up / Refinance
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
