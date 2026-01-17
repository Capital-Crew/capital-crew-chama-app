'use client'

import React from 'react'
import { Printer } from 'lucide-react'

// TypeScript Interface for Top-Up Items
interface TopUpItem {
    loanNo: string
    product: string
    principalTopUp: number
    interestTopUp: number
    penalty: number
    refinanceFee: number
    totalTopUp: number
}

// Main Props Interface
interface LoanAppraisalProps {
    // Header
    organizationName?: string

    // Left Column - Loan Details
    loanNo: string
    applicationDate: string
    loanType: string
    memberNo: string
    memberName: string
    amountApplied: number

    // Right Column - Deposits Analysis
    memberContribution: number
    maxAvailable: number
    depositsMultiplier: number
    loanBalance: number
    topUpAmount: number
    balanceAfterTopup: number
    netLoan: number

    // Loan Terms Bar
    interestRate: number
    installments: number
    monthlyRepayment: number

    // Top-Up Information Table
    topUpItems: TopUpItem[]

    // Qualification & Fees
    recommendedAmount: number
    approvedAmount: number
    processingFee: number
    insuranceFee: number
    shareCapitalDeduction: number
    existingLoanOffset: number
    totalDeductions: number
    netDisbursed: number
}

export function LoanAppraisalReport({
    organizationName = "CAPITAL CREW SHG",
    loanNo,
    applicationDate,
    loanType,
    memberNo,
    memberName,
    amountApplied,
    memberContribution,
    maxAvailable,
    depositsMultiplier,
    loanBalance,
    topUpAmount,
    balanceAfterTopup,
    netLoan,
    interestRate,
    installments,
    monthlyRepayment,
    topUpItems,
    recommendedAmount,
    approvedAmount,
    processingFee,
    insuranceFee,
    shareCapitalDeduction,
    existingLoanOffset,
    totalDeductions,
    netDisbursed
}: LoanAppraisalProps) {

    const formatCurrency = (amount: number) => {
        return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="max-w-6xl mx-auto bg-white">
            {/* Print Button - Hidden on Print */}
            <div className="flex justify-end mb-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-sm transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    Print Report
                </button>
            </div>

            {/* Main Report Container */}
            <div className="border-2 border-slate-900 p-8 bg-white">

                {/* 1. HEADER SECTION */}
                <div className="text-center mb-8 pb-4 border-b-2 border-slate-900">
                    <h1 className="text-3xl font-black uppercase tracking-wider mb-3 text-slate-900">
                        {organizationName}
                    </h1>
                    <div className="inline-block bg-slate-900 text-white px-8 py-3 mt-2">
                        <h2 className="text-xl font-black uppercase tracking-wide">
                            LOAN APPRAISAL REPORT
                        </h2>
                    </div>
                </div>

                {/* 2. KEY INFORMATION GRID (2 Columns) */}
                <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-slate-300">

                    {/* LEFT COLUMN - Loan Details */}
                    <div className="space-y-4">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-4 pb-2 border-b-2 border-slate-400">
                            Loan Details
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Loan No:</span>
                                <span className="font-bold text-slate-900">{loanNo}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Application Date:</span>
                                <span className="font-bold text-slate-900">{applicationDate}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Loan Type:</span>
                                <span className="font-bold text-slate-900">{loanType}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Member No:</span>
                                <span className="font-bold text-slate-900">{memberNo}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Member Name:</span>
                                <span className="font-bold text-slate-900">{memberName}</span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-slate-300">
                                <span className="text-gray-500 font-semibold">Amount Applied:</span>
                                <span className="font-black text-blue-600 text-base">{formatCurrency(amountApplied)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Deposits Analysis */}
                    <div className="space-y-4">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-4 pb-2 border-b-2 border-slate-400">
                            Deposits Analysis
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Member Contribution:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(memberContribution)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Max Available:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(maxAvailable)}</span>
                            </div>

                            <div className="flex justify-between items-center bg-cyan-50 -mx-2 px-2 py-2 rounded">
                                <span className="text-gray-700 font-semibold">Deposits Multiplier:</span>
                                <span className="font-black text-2xl text-cyan-600">
                                    {depositsMultiplier}x
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Loan Balance:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(loanBalance)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Top-Up Amount:</span>
                                <span className="font-bold text-orange-600">{formatCurrency(topUpAmount)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Balance After Top-up:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(balanceAfterTopup)}</span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-slate-300">
                                <span className="text-gray-500 font-semibold">Net Loan:</span>
                                <span className="font-black text-green-600 text-base">{formatCurrency(netLoan)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. LOAN TERMS BAR (4 Columns) */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 mb-8 rounded-lg shadow-lg">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-xs font-medium opacity-90 mb-1 uppercase tracking-wider">Interest Rate</div>
                            <div className="text-3xl font-black">{interestRate}%</div>
                        </div>
                        <div>
                            <div className="text-xs font-medium opacity-90 mb-1 uppercase tracking-wider">Installments</div>
                            <div className="text-3xl font-black">{installments}</div>
                        </div>
                        <div>
                            <div className="text-xs font-medium opacity-90 mb-1 uppercase tracking-wider">Monthly Repayment</div>
                            <div className="text-3xl font-black">{formatCurrency(monthlyRepayment)}</div>
                        </div>
                    </div>
                </div>

                {/* 4. TOP-UP INFORMATION TABLE */}
                {topUpItems.length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-3 pb-2 border-b-2 border-slate-400">
                            Top-Up Information
                        </h3>
                        <div className="border-2 border-slate-900">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-3 py-3 text-left font-black uppercase text-xs border-r border-slate-700">Loan No</th>
                                        <th className="px-3 py-3 text-left font-black uppercase text-xs border-r border-slate-700">Product</th>
                                        <th className="px-3 py-3 text-right font-black uppercase text-xs border-r border-slate-700">Principal TopUp</th>
                                        <th className="px-3 py-3 text-right font-black uppercase text-xs border-r border-slate-700">Interest TopUp</th>
                                        <th className="px-3 py-3 text-right font-black uppercase text-xs border-r border-slate-700">Penalty</th>
                                        <th className="px-3 py-3 text-right font-black uppercase text-xs border-r border-slate-700">Refinance Fee</th>
                                        <th className="px-3 py-3 text-right font-black uppercase text-xs">Total TopUp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topUpItems.map((item, index) => (
                                        <tr key={index} className="border-b-2 border-slate-300">
                                            <td className="px-3 py-3 border-r border-slate-300 font-bold">{item.loanNo}</td>
                                            <td className="px-3 py-3 border-r border-slate-300">{item.product}</td>
                                            <td className="px-3 py-3 border-r border-slate-300 text-right font-bold">{formatCurrency(item.principalTopUp)}</td>
                                            <td className="px-3 py-3 border-r border-slate-300 text-right font-bold">{formatCurrency(item.interestTopUp)}</td>
                                            <td className="px-3 py-3 border-r border-slate-300 text-right font-bold">{formatCurrency(item.penalty)}</td>
                                            <td className="px-3 py-3 border-r border-slate-300 text-right font-bold">{formatCurrency(item.refinanceFee)}</td>
                                            <td className="px-3 py-3 text-right font-black text-orange-600">{formatCurrency(item.totalTopUp)}</td>
                                        </tr>
                                    ))}
                                    {/* TOTALS ROW */}
                                    <tr className="bg-slate-200 font-black">
                                        <td colSpan={2} className="px-3 py-3 border-r border-slate-400 uppercase text-xs">TOTALS</td>
                                        <td className="px-3 py-3 border-r border-slate-400 text-right">
                                            {formatCurrency(topUpItems.reduce((sum, item) => sum + item.principalTopUp, 0))}
                                        </td>
                                        <td className="px-3 py-3 border-r border-slate-400 text-right">
                                            {formatCurrency(topUpItems.reduce((sum, item) => sum + item.interestTopUp, 0))}
                                        </td>
                                        <td className="px-3 py-3 border-r border-slate-400 text-right">
                                            {formatCurrency(topUpItems.reduce((sum, item) => sum + item.penalty, 0))}
                                        </td>
                                        <td className="px-3 py-3 border-r border-slate-400 text-right">
                                            {formatCurrency(topUpItems.reduce((sum, item) => sum + item.refinanceFee, 0))}
                                        </td>
                                        <td className="px-3 py-3 text-right text-orange-600">
                                            {formatCurrency(topUpItems.reduce((sum, item) => sum + item.totalTopUp, 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. QUALIFICATION & FEES SECTION (Two Panels) */}
                <div className="grid grid-cols-2 gap-6">

                    {/* PANEL A - Qualification Criteria */}
                    <div className="border-2 border-slate-400 rounded-lg p-5 bg-slate-50">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-4 pb-2 border-b-2 border-slate-400">
                            Qualification Criteria
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-semibold">Recommended Amount:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(recommendedAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-400">
                                <span className="text-gray-700 font-bold">Approved Amount:</span>
                                <span className="font-black text-xl text-green-600">{formatCurrency(approvedAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* PANEL B - Disbursement Reconciliation */}
                    <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-sm flex justify-between items-center">
                            <span>Disbursement Reconciliation</span>
                            <span>KES</span>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-200">
                                {/* Approved Amount */}
                                <tr className="bg-green-50">
                                    <td className="px-4 py-3 font-bold text-slate-700">Approved Loan Amount</td>
                                    <td className="px-4 py-3 font-black text-right text-green-700">{formatCurrency(approvedAmount)}</td>
                                </tr>

                                {/* Deductions Header */}
                                <tr className="bg-slate-50">
                                    <td colSpan={2} className="px-4 py-2 text-xs font-black uppercase text-slate-500 tracking-wider">
                                        Less: Deductions
                                    </td>
                                </tr>

                                {/* Fees */}
                                <tr>
                                    <td className="px-4 py-2 text-slate-600 pl-8 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                        Processing Fee
                                    </td>
                                    <td className="px-4 py-2 text-right text-red-600 font-bold">({formatCurrency(processingFee)})</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 text-slate-600 pl-8 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                        Insurance Fee
                                    </td>
                                    <td className="px-4 py-2 text-right text-red-600 font-bold">({formatCurrency(insuranceFee)})</td>
                                </tr>


                                {shareCapitalDeduction > 0 && (
                                    <tr>
                                        <td className="px-4 py-2 text-slate-600 pl-8 relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                            Share Capital Boost
                                        </td>
                                        <td className="px-4 py-2 text-right text-red-600 font-bold">({formatCurrency(shareCapitalDeduction)})</td>
                                    </tr>
                                )}

                                {/* Top Up Fees (Aggregated) */}
                                {topUpItems.reduce((acc, item) => acc + item.refinanceFee, 0) > 0 && (
                                    <tr>
                                        <td className="px-4 py-2 text-slate-600 pl-8 relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                            Top Up / Refinance Fees
                                        </td>
                                        <td className="px-4 py-2 text-right text-red-600 font-bold">
                                            ({formatCurrency(topUpItems.reduce((acc, item) => acc + item.refinanceFee, 0))})
                                        </td>
                                    </tr>
                                )}

                                {/* Top Ups / Offsets (Net of Fee) */}
                                {topUpItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 text-slate-600 pl-8 relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                            Offset Clearance: {item.loanNo}
                                        </td>
                                        <td className="px-4 py-2 text-right text-orange-600 font-bold">
                                            ({formatCurrency(item.totalTopUp - item.refinanceFee)})
                                        </td>
                                    </tr>
                                ))}

                                {/* Total Deductions Summary */}
                                <tr className="bg-slate-50 font-bold">
                                    <td className="px-4 py-2 text-slate-600 text-right uppercase text-xs tracking-wider">Total Deductions</td>
                                    <td className="px-4 py-2 text-right text-red-700">({formatCurrency(totalDeductions)})</td>
                                </tr>

                                {/* Net Disbursement */}
                                <tr className="bg-blue-50 border-t-2 border-blue-200">
                                    <td className="px-4 py-4 font-black text-blue-900 uppercase tracking-wide">Net Disbursement</td>
                                    <td className="px-4 py-4 font-black text-right text-2xl text-blue-600">{formatCurrency(netDisbursed)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer / Signature Area */}
                <div className="mt-10 pt-6 border-t-2 border-slate-400 grid grid-cols-3 gap-8 text-sm">
                    <div>
                        <div className="h-16 border-b-2 border-slate-900"></div>
                        <p className="font-bold text-slate-700 mt-2">Prepared By</p>
                        <p className="text-xs text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                        <div className="h-16 border-b-2 border-slate-900"></div>
                        <p className="font-bold text-slate-700 mt-2">Reviewed By</p>
                        <p className="text-xs text-slate-500 mt-1">Signature & Date</p>
                    </div>
                    <div>
                        <div className="h-16 border-b-2 border-slate-900"></div>
                        <p className="font-bold text-slate-700 mt-2">Approved By</p>
                        <p className="text-xs text-slate-500 mt-1">Signature & Date</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

// Example Usage with Dummy Data
export function LoanAppraisalReportExample() {
    const dummyData: LoanAppraisalProps = {
        organizationName: "CAPITAL CREW SHG",

        // Loan Details
        loanNo: "LN-202512-005",
        applicationDate: "December 28, 2025",
        loanType: "Test Product - 2% Interest",
        memberNo: "34996",
        memberName: "Titus Gitau Njuguna",
        amountApplied: 258000.00,

        // Deposits Analysis
        memberContribution: 60000.00,
        maxAvailable: 180000.00,
        depositsMultiplier: 3,
        loanBalance: 128131.87,
        topUpAmount: 133731.87,
        balanceAfterTopup: 0.00,
        netLoan: 124268.13,

        // Loan Terms
        interestRate: 2,
        installments: 12,
        monthlyRepayment: 22500.00,

        // Top-Up Items
        topUpItems: [
            {
                loanNo: "LN-202511-003",
                product: "Emergency Loan",
                principalTopUp: 100000.00,
                interestTopUp: 22264.45,
                penalty: 0.00,
                refinanceFee: 5867.42,
                totalTopUp: 128131.87
            }
        ],

        // Qualification & Fees
        recommendedAmount: 180000.00,
        approvedAmount: 258000.00,
        processingFee: 2580.00,
        insuranceFee: 1290.00,
        shareCapitalDeduction: 0.00,
        existingLoanOffset: 133731.87,
        totalDeductions: 137601.87,
        netDisbursed: 124268.13
    }

    return <LoanAppraisalReport {...dummyData} />
}
