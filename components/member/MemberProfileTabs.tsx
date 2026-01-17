'use client'

import { useState } from 'react'
import LoansTab from './tabs/LoansTab' // This import will be removed or renamed if LoansTab is no longer used for the 'loans' tab
import ContributionsTab from './tabs/ContributionsTab'
import StatementsTab from './tabs/StatementsTab'
import NextOfKinTab from './tabs/NextOfKinTab'
import { MemberStatsView } from './MemberStatsView'
import MemberLoansView from './MemberLoansView' // Added import for MemberLoansView
import { MemberStats, LoanPortfolioItem } from '@/types/member-dashboard'

export default function MemberProfileTabs({
    member,
    contributions,
    loans,
    ledger,

    detailedStats,
    snapshot
}: {
    member: any,
    contributions: any[],
    loans: any[],
    ledger: any[],
    detailedStats: { stats: MemberStats, loans: LoanPortfolioItem[] } | null,
    snapshot: any
}) {
    const [activeTab, setActiveTab] = useState<'loans' | 'statements' | 'contributions' | 'kin'>('loans')

    const tabs = [
        { id: 'loans', label: 'Member Statistics' },
        { id: 'my-loans', label: 'My Loans' },
        { id: 'statements', label: 'Account Statements' },
        { id: 'contributions', label: 'Contribution History' },
        { id: 'kin', label: 'Next of Kin' },
    ]

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[600px]">
            {/* Tab Header */}
            <div className="border-b border-gray-200 px-6 pt-2">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-all
                                ${activeTab === tab.id
                                    ? 'border-teal-500 text-teal-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content Panels */}
            <div className="p-0">
                {activeTab === 'loans' && detailedStats ? (
                    <MemberStatsView stats={detailedStats.stats} loans={detailedStats.loans} memberId={member.member.id} snapshot={snapshot} />
                ) : activeTab === 'loans' ? (
                    <LoansTab loans={loans} />
                ) : null}
                {activeTab === 'my-loans' && (
                    <MemberLoansView loans={
                        (loans && loans.length > 0 ? loans : (detailedStats ? detailedStats.loans as any : []))
                            .filter((l: any) => l.memberId === member.member.id || (l as any).member?.id === member.member.id || (l as any).member?.memberNumber === member.member.memberNumber)
                    } />
                )}
                {activeTab === 'statements' && <StatementsTab ledger={ledger} />}
                {activeTab === 'contributions' && <ContributionsTab contributions={contributions} />}
                {activeTab === 'kin' && <NextOfKinTab memberId={member.member.id} beneficiaries={member.member.beneficiaries || []} />}
            </div>
        </div>
    )
}
