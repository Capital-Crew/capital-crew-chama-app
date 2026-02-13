'use client'

import React, { useState, useEffect } from 'react'
import { getLoanStatement } from '@/app/actions/getLoanStatement'
import { processTransactions, type StatementRow } from '@/lib/statementProcessor'
import { formatCurrency } from '@/lib/financialMath'
import { AlertCircleIcon, FileTextIcon, RotateCcwIcon, Download, Printer } from 'lucide-react'
import { reverseLoanTransaction } from '@/app/actions/loan-reversal-actions'
import dynamic from 'next/dynamic'

const RepaymentReceipt = dynamic(
    () => import('@/components/receipts/RepaymentReceipt').then((mod) => mod.RepaymentReceipt),
    { ssr: false }
)

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
)
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface LoanStatementData {
    loanApplicationNumber: string
    member: {
        name: string
        memberNumber: number
    }
    loanProduct: {
        name: string
    } | null
    walletTransactions: any[]
}

export function LoanStatementView({ loanId, refreshKey }: { loanId: string, refreshKey?: number }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loanData, setLoanData] = useState<LoanStatementData | null>(null)
    const [statementRows, setStatementRows] = useState<StatementRow[]>([])
    const [reversingId, setReversingId] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const fetchStatement = async () => {
        try {
            setLoading(true)
            const loan = await getLoanStatement(loanId)

            setLoanData({
                loanApplicationNumber: loan.loanApplicationNumber,
                member: loan.member,
                loanProduct: loan.loanProduct,
                walletTransactions: loan.walletTransactions
            })

            // Process transactions to get statement rows
            const rows = processTransactions(loan.walletTransactions)
            setStatementRows(rows)
        } catch (err: any) {
            setError(err.message || 'Failed to load statement')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatement()
    }, [loanId, refreshKey])

    const handleReverse = async (txId: string, amount: number) => {
        const reason = prompt("Enter reason for reversing this repayment:")
        if (!reason) return

        setReversingId(txId)
        try {
            const result = await reverseLoanTransaction(txId, reason)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Transaction reversed successfully')
                fetchStatement() // Refresh locally
                router.refresh() // Refresh server components if any
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to reverse')
        } finally {
            setReversingId(null)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        )
    }

    if (error || !loanData) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
                    <AlertCircleIcon className="w-6 h-6 text-red-600" />
                    <div>
                        <h3 className="font-black text-red-900">Error Loading Statement</h3>
                        <p className="text-sm text-red-700">{error || 'Unable to load loan statement'}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                        <FileTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Loan Statement</h2>
                        <p className="text-sm text-slate-600">{loanData.loanApplicationNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</div>
                        <div className="text-sm font-black text-slate-900">{loanData.member.name}</div>
                        <div className="text-xs text-slate-600">Member #{loanData.member.memberNumber}</div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</div>
                        <div className="text-sm font-black text-slate-900">{loanData.loanProduct?.name || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* Statement Table/List */}
            {statementRows.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
                    <FileTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-600 mb-2">No Transactions Yet</h3>
                    <p className="text-sm text-slate-500">
                        This loan has no transaction history to display.
                    </p>
                </div>
            ) : (
                <>
                    {/* MOBILE: Transaction Feed */}
                    <div className="md:hidden space-y-3">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Transactions ({statementRows.length})</h3>
                        {statementRows.map((row, index) => {
                            const isCredit = row.credit !== null;
                            const amount = isCredit ? row.credit : row.debit;
                            const amountColor = isCredit ? 'text-emerald-600' : 'text-slate-800';
                            const sign = isCredit ? '+' : '-';

                            // Determine if this row is reversible (it's a Credit i.e., Repayment, and description says Repayment)
                            // Strict check: we need original txId. StatementRow usually has it.
                            // Assuming 'row.txId' exists and description contains 'Repayment'
                            const isReversible = isCredit && row.description.toLowerCase().includes('repayment') && !row.isVoided;

                            return (
                                <div key={`${row.txId}-${index}`} className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative ${row.isVoided ? 'opacity-60 bg-slate-50' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className={`font-bold text-sm line-clamp-2 ${row.isVoided ? 'line-through text-red-500' : 'text-slate-800'}`}>{row.description}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-1">{row.date}</p>
                                        </div>
                                        <div className="text-right whitespace-nowrap ml-4">
                                            <p className={`font-black text-sm ${amountColor}`}>
                                                {sign} {amount !== null ? formatCurrency(amount) : '-'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Amount</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Running Bal</span>
                                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                            {formatCurrency(row.runningBalance)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex justify-end gap-2">
                                        {isMounted && isCredit && row.allocation && (
                                            <PDFDownloadLink
                                                document={
                                                    <RepaymentReceipt data={{
                                                        transactionId: row.txId,
                                                        date: row.createdAt,
                                                        amount: row.credit!,
                                                        description: row.description,
                                                        member: { name: loanData!.member.name, number: loanData!.member.memberNumber.toString() },
                                                        loan: { number: loanData!.loanApplicationNumber, product: loanData!.loanProduct.name },
                                                        allocation: row.allocation
                                                    }} />
                                                }
                                                fileName={`Receipt-${row.txId}.pdf`}
                                                className="text-[10px] font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Download className="w-3 h-3" />
                                                Receipt
                                            </PDFDownloadLink>
                                        )}
                                        {isReversible && (
                                            <button
                                                onClick={() => handleReverse(row.txId, row.credit!)}
                                                disabled={reversingId === row.txId}
                                                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                {reversingId === row.txId ? <div className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" /> : <RotateCcwIcon className="w-3 h-3" />}
                                                Reverse
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Mobile Summary Footer */}
                        <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Balance</span>
                                <span className="font-black text-xl text-cyan-400">
                                    {statementRows.length > 0
                                        ? formatCurrency(statementRows[statementRows.length - 1].runningBalance)
                                        : formatCurrency(0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP: Full Table */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Desc
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider">
                                            Debit
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black text-emerald-600 uppercase tracking-wider">
                                            Credit
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-black text-slate-900 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-wider w-10">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {statementRows.map((row, index) => {
                                        const isReversible = row.credit !== null && row.description.toLowerCase().includes('repayment') && !row.isVoided;
                                        return (
                                            <tr
                                                key={`${row.txId}-${index}`}
                                                className={`hover:bg-slate-50 transition-colors group ${row.isVoided ? 'opacity-60 bg-slate-50 italic' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-900 font-medium whitespace-nowrap">
                                                    {row.date}
                                                </td>
                                                <td className={`px-4 py-3 text-sm text-slate-700 ${row.isVoided ? 'line-through text-red-500' : ''}`}>
                                                    {row.description}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-slate-700">
                                                    {row.debit !== null ? (
                                                        formatCurrency(row.debit)
                                                    ) : (
                                                        <span className="text-slate-200">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">
                                                    {row.credit !== null ? (
                                                        formatCurrency(row.credit)
                                                    ) : (
                                                        <span className="text-slate-200">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                                                    {formatCurrency(row.runningBalance)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isMounted && row.credit !== null && row.allocation && (
                                                            <PDFDownloadLink
                                                                document={
                                                                    <RepaymentReceipt data={{
                                                                        transactionId: row.txId,
                                                                        date: row.createdAt,
                                                                        amount: row.credit!,
                                                                        description: row.description,
                                                                        member: { name: loanData!.member.name, number: loanData!.member.memberNumber.toString() },
                                                                        loan: { number: loanData!.loanApplicationNumber, product: loanData!.loanProduct.name },
                                                                        allocation: row.allocation
                                                                    }} />
                                                                }
                                                                fileName={`Receipt-${row.txId}.pdf`}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-cyan-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg"
                                                                title="Download Receipt"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </PDFDownloadLink>
                                                        )}
                                                        {isReversible && (
                                                            <button
                                                                onClick={() => handleReverse(row.txId, row.credit!)}
                                                                disabled={reversingId === row.txId}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Reverse Transaction"
                                                            >
                                                                {reversingId === row.txId ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" /> : <RotateCcwIcon className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                {/* Summary Footer */}
                                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm font-black text-slate-900 uppercase">
                                            Current Balance
                                        </td>
                                        <td colSpan={2} className="px-4 py-3 text-sm text-right text-slate-600 font-bold">
                                            {statementRows.length} transaction{statementRows.length !== 1 ? 's' : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-black text-cyan-700">
                                            {statementRows.length > 0
                                                ? formatCurrency(statementRows[statementRows.length - 1].runningBalance)
                                                : formatCurrency(0)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This statement shows the chronological history of all loan-related transactions.
                    Debit entries (red) increase the outstanding balance, while credit entries (green) reduce it.
                </p>
            </div>
        </div>
    )
}
