'use client'

/**
 * Loan Repayment Schedule Print Component
 * 
 * Displays a professional loan repayment schedule matching
 * the standard SACCO format for printing or PDF export.
 */

import React from 'react'
import { formatDate } from '@/lib/utils'
import type { FormattedScheduleData } from '@/services/loan-schedule-formatter-service'

interface Props {
    scheduleData: FormattedScheduleData
}

export function RepaymentSchedulePrint({ scheduleData }: Props) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="print-container">
            {}
            <div className="no-print mb-4 flex justify-end gap-2">
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden"
                >
                    🖨️ Print Schedule
                </button>
            </div>

            {}
            <div className="schedule-document bg-white p-8">
                {}
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800">
                    <div>
                        <h1 className="text-xl font-bold">Loan Repayment Schedule</h1>
                    </div>
                    <div className="text-right border-2 border-gray-800 rounded px-4 py-2">
                        <h2 className="text-lg font-bold mb-1">
                            {scheduleData.organization.name}
                        </h2>
                        <div className="text-sm">{scheduleData.organization.poBox}</div>
                        <div className="text-sm">{scheduleData.organization.phone}</div>
                    </div>
                </div>

                {}
                <div className="grid grid-cols-2 gap-8 mb-6">
                    {}
                    <div className="space-y-2">
                        <DetailRow
                            label="Loan Number"
                            value={scheduleData.loan.loanNumber}
                        />
                        <DetailRow
                            label="Loan Product Type"
                            value={scheduleData.loan.productType}
                        />
                        <DetailRow
                            label="Approved Amount"
                            value={scheduleData.loan.approvedAmount.toLocaleString('en-KE', {
                                minimumFractionDigits: 2
                            })}
                        />
                        <DetailRow
                            label="Installments"
                            value={scheduleData.loan.installments.toString()}
                        />
                        <DetailRow
                            label="Monthly Repayment"
                            value={scheduleData.loan.monthlyRepayment.toLocaleString('en-KE', {
                                minimumFractionDigits: 2
                            })}
                        />
                    </div>

                    {}
                    <div className="space-y-2">
                        <DetailRow
                            label="Member No"
                            value={scheduleData.member.memberNo}
                        />
                        <DetailRow
                            label="Member Name"
                            value={scheduleData.member.memberName}
                        />
                        <DetailRow
                            label="Issued Date"
                            value={new Date(scheduleData.member.issuedDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        />
                        <DetailRow
                            label="Interest Rate (%)"
                            value={scheduleData.member.interestRate.toString()}
                        />
                    </div>
                </div>

                {}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Code
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Repayment Date
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Opening Balance
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Principal
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Interest
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Monthly Pay
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center font-bold">
                                Closing Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleData.schedule.map((row, index) => (
                            <tr key={index}>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {row.code}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {new Date(row.repaymentDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-right">
                                    {row.openingBalance.toLocaleString('en-KE', {
                                        minimumFractionDigits: 2
                                    })}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-right">
                                    {row.principal.toLocaleString('en-KE', {
                                        minimumFractionDigits: 2
                                    })}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-right">
                                    {row.interest.toLocaleString('en-KE', {
                                        minimumFractionDigits: 2
                                    })}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-right">
                                    {row.monthlyPay.toLocaleString('en-KE', {
                                        minimumFractionDigits: 2
                                    })}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-right">
                                    {row.closingBalance.toLocaleString('en-KE', {
                                        minimumFractionDigits: 2
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }

                    .schedule-document {
                        box-shadow: none !important;
                    }

                    @page {
                        size: A4;
                        margin: 20mm;
                    }

                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    )
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex">
            <div className="font-bold min-w-[150px]">{label}</div>
            <div className="flex-1">{value}</div>
        </div>
    )
}
