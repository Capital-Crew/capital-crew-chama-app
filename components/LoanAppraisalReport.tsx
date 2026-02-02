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
                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-sm transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    Print Report
                </button>
            </div>

            {/* Mobile: Prominent Monthly Repayment Card */}
            <div className="lg:hidden mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">
                    Monthly Repayment
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 break-words">
                    {formatCurrency(monthlyRepayment)}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 text-sm mt-4 pt-4 border-t border-white/20">
                    <div className="flex-1 min-w-0">
                        <p className="opacity-75 text-xs">Installments</p>
                        <p className="font-bold truncate">{installments} months</p>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="opacity-75 text-xs">Interest Rate</p>
                        <p className="font-bold truncate">{interestRate}% p.m.</p>
                    </div>
                </div>
            </div>

            {/* Main Report Container */}
            <div className="border-2 border-slate-900 p-4 lg:p-8 bg-white">

                {/* 1. HEADER SECTION */}
                <div className="text-center mb-8 pb-4 border-b-2 border-slate-900">
                    <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-wider mb-3 text-slate-900">
                        {organizationName}
                    </h1>
                    <div className="inline-block bg-slate-900 text-white px-6 lg:px-8 py-2 lg:py-3 mt-2">
                        <h2 className="text-lg lg:text-xl font-black uppercase tracking-wide">
                            LOAN APPRAISAL REPORT
                        </h2>
                    </div>
                </div>

                {/* 2. KEY INFORMATION GRID (Responsive) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 pb-8 border-b-2 border-slate-300">

                    {/* LEFT COLUMN - Loan Details */}
                    <div className="space-y-4">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-4 pb-2 border-b-2 border-slate-400">
                            Loan Details
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Loan No:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{loanNo}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Application Date:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{applicationDate}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Loan Type:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{loanType}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Member No:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{memberNo}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Member Name:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{memberName}</span>
                            </div>

                            <div className="flex justify-between gap-2 pt-2 border-t border-slate-300">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Amount Applied:</span>
                                <span className="font-black text-blue-600 text-base text-right break-words">{formatCurrency(amountApplied)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Deposits Analysis */}
                    <div className="space-y-4">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-4 pb-2 border-b-2 border-slate-400">
                            Deposits Analysis
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Member Contribution:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{formatCurrency(memberContribution)}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Max Available:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{formatCurrency(maxAvailable)}</span>
                            </div>

                            <div className="flex justify-between items-center gap-2 bg-cyan-50 -mx-2 px-2 py-2 rounded">
                                <span className="text-gray-700 font-semibold flex-shrink-0">Deposits Multiplier:</span>
                                <span className="font-black text-xl sm:text-2xl text-cyan-600 break-words">
                                    {depositsMultiplier}x
                                </span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Loan Balance:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{formatCurrency(loanBalance)}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Top-Up Amount:</span>
                                <span className="font-bold text-orange-600 text-right break-words">{formatCurrency(topUpAmount)}</span>
                            </div>

                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Balance After Top-up:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{formatCurrency(balanceAfterTopup)}</span>
                            </div>

                            <div className="flex justify-between gap-2 pt-2 border-t border-slate-300">
                                <span className="text-gray-500 font-semibold flex-shrink-0">Net Loan:</span>
                                <span className="font-black text-green-600 text-base text-right break-words">{formatCurrency(netLoan)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EXEMPTIONS SECTION - Positioned below loan details */}
                {/* This will be passed from LoanAppraisalCard */}

                {/* 3. LOAN TERMS BAR (Desktop Only - Mobile has card at top) */}
                <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 mb-8 rounded-lg shadow-lg">
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
                        {/* Horizontal scroll wrapper for mobile */}
                        <div className="overflow-x-auto -mx-2 px-2 lg:mx-0 lg:px-0">
                            <div className="border-2 border-slate-900 min-w-[640px] lg:min-w-0">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead className="bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-black uppercase text-xs border-r border-slate-700 whitespace-nowrap">Loan No</th>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-black uppercase text-xs border-r border-slate-700 whitespace-nowrap">Product</th>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-black uppercase text-xs border-r border-slate-700 whitespace-nowrap">Principal</th>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-black uppercase text-xs border-r border-slate-700 whitespace-nowrap">Interest</th>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-black uppercase text-xs border-r border-slate-700 whitespace-nowrap">Penalty</th>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-black uppercase text-xs border-r border-slate-700 whitespace-nowrap">Refinance</th>
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-black uppercase text-xs whitespace-nowrap">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topUpItems.map((item, index) => (
                                            <tr key={index} className="border-b-2 border-slate-300">
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-300 font-bold whitespace-nowrap">{item.loanNo}</td>
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-300 whitespace-nowrap">{item.product}</td>
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-300 text-right font-bold whitespace-nowrap">{formatCurrency(item.principalTopUp)}</td>
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-300 text-right font-bold whitespace-nowrap">{formatCurrency(item.interestTopUp)}</td>
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-300 text-right font-bold whitespace-nowrap">{formatCurrency(item.penalty)}</td>
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-300 text-right font-bold whitespace-nowrap">{formatCurrency(item.refinanceFee)}</td>
                                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-right font-black text-orange-600 whitespace-nowrap">{formatCurrency(item.totalTopUp)}</td>
                                            </tr>
                                        ))}
                                        {/* TOTALS ROW */}
                                        <tr className="bg-slate-200 font-black">
                                            <td colSpan={2} className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-400 uppercase text-xs">TOTALS</td>
                                            <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-400 text-right whitespace-nowrap">
                                                {formatCurrency(topUpItems.reduce((sum, item) => sum + item.principalTopUp, 0))}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-400 text-right whitespace-nowrap">
                                                {formatCurrency(topUpItems.reduce((sum, item) => sum + item.interestTopUp, 0))}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-400 text-right whitespace-nowrap">
                                                {formatCurrency(topUpItems.reduce((sum, item) => sum + item.penalty, 0))}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 sm:py-3 border-r border-slate-400 text-right whitespace-nowrap">
                                                {formatCurrency(topUpItems.reduce((sum, item) => sum + item.refinanceFee, 0))}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-orange-600 whitespace-nowrap">
                                                {formatCurrency(topUpItems.reduce((sum, item) => sum + item.totalTopUp, 0))}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. QUALIFICATION & FEES SECTION (Responsive) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* PANEL A - Qualification Criteria */}
                    <div className="border-2 border-slate-400 rounded-lg p-5 bg-slate-50">
                        <h3 className="font-black text-sm uppercase text-slate-700 mb-4 pb-2 border-b-2 border-slate-400">
                            Qualification Criteria
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-600 font-semibold flex-shrink-0">Recommended Amount:</span>
                                <span className="font-bold text-slate-900 text-right break-words">{formatCurrency(recommendedAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 pt-3 border-t-2 border-slate-400">
                                <span className="text-gray-700 font-bold flex-shrink-0">Approved Amount:</span>
                                <span className="font-black text-lg sm:text-xl text-green-600 text-right break-words">{formatCurrency(approvedAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* PANEL B - Disbursement Reconciliation */}
                    <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 text-white px-2 sm:px-4 py-2 font-black uppercase text-xs sm:text-sm flex justify-between items-center gap-2">
                            <span className="truncate">Disbursement Reconciliation</span>
                            <span className="flex-shrink-0">KES</span>
                        </div>
                        <table className="w-full text-xs sm:text-sm">
                            <tbody className="divide-y divide-slate-200">
                                {/* Approved Amount */}
                                <tr className="bg-green-50">
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-slate-700">Approved Loan Amount</td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-black text-right text-green-700 whitespace-nowrap">{formatCurrency(approvedAmount)}</td>
                                </tr>

                                {/* Deductions Header */}
                                <tr className="bg-slate-50">
                                    <td colSpan={2} className="px-2 sm:px-4 py-2 text-xs font-black uppercase text-slate-500 tracking-wider">
                                        Less: Deductions
                                    </td>
                                </tr>

                                {/* Fees */}
                                <tr>
                                    <td className="px-2 sm:px-4 py-2 text-slate-600 pl-6 sm:pl-8 relative">
                                        <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                        Processing Fee
                                    </td>
                                    <td className="px-2 sm:px-4 py-2 text-right text-red-600 font-bold whitespace-nowrap">({formatCurrency(processingFee)})</td>
                                </tr>
                                <tr>
                                    <td className="px-2 sm:px-4 py-2 text-slate-600 pl-6 sm:pl-8 relative">
                                        <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                        Insurance Fee
                                    </td>
                                    <td className="px-2 sm:px-4 py-2 text-right text-red-600 font-bold whitespace-nowrap">({formatCurrency(insuranceFee)})</td>
                                </tr>


                                {shareCapitalDeduction > 0 && (
                                    <tr>
                                        <td className="px-2 sm:px-4 py-2 text-slate-600 pl-6 sm:pl-8 relative">
                                            <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                            Share Capital Boost
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-right text-red-600 font-bold whitespace-nowrap">({formatCurrency(shareCapitalDeduction)})</td>
                                    </tr>
                                )}

                                {/* Top Up Fees (Aggregated) */}
                                {topUpItems.reduce((acc, item) => acc + item.refinanceFee, 0) > 0 && (
                                    <tr>
                                        <td className="px-2 sm:px-4 py-2 text-slate-600 pl-6 sm:pl-8 relative">
                                            <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                            Top Up / Refinance Fees
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-right text-red-600 font-bold whitespace-nowrap">
                                            ({formatCurrency(topUpItems.reduce((acc, item) => acc + item.refinanceFee, 0))})
                                        </td>
                                    </tr>
                                )}

                                {/* Top Ups / Offsets (Net of Fee) */}
                                {topUpItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-2 sm:px-4 py-2 text-slate-600 pl-6 sm:pl-8 relative">
                                            <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-slate-300"></span>
                                            <span className="break-words">Offset Clearance: {item.loanNo}</span>
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-right text-orange-600 font-bold whitespace-nowrap">
                                            ({formatCurrency(item.totalTopUp - item.refinanceFee)})
                                        </td>
                                    </tr>
                                ))}

                                {/* Total Deductions Summary */}
                                <tr className="bg-slate-50 font-bold">
                                    <td className="px-2 sm:px-4 py-2 text-slate-600 text-right uppercase text-xs tracking-wider">Total Deductions</td>
                                    <td className="px-2 sm:px-4 py-2 text-right text-red-700 whitespace-nowrap">({formatCurrency(totalDeductions)})</td>
                                </tr>

                                {/* Net Disbursement */}
                                <tr className="bg-blue-50 border-t-2 border-blue-200">
                                    <td className="px-2 sm:px-4 py-3 sm:py-4 font-black text-blue-900 uppercase tracking-wide text-xs sm:text-sm">Net Disbursement</td>
                                    <td className="px-2 sm:px-4 py-3 sm:py-4 font-black text-right text-lg sm:text-2xl text-blue-600 whitespace-nowrap">{formatCurrency(netDisbursed)}</td>
                                </tr>
                            </tbody>
                        </table>
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
