'use client'

import { useState } from 'react'
import { PremiumTabs } from '../shared/PremiumTabs'
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
    const [activeTab, setActiveTab] = useState<'loans' | 'my-loans' | 'statements' | 'contributions' | 'kin'>('loans')

    const tabs = [
        { id: 'loans', label: 'Member Statistics' },
        { id: 'my-loans', label: 'My Loans' },
        { id: 'statements', label: 'Account Statements' },
        { id: 'contributions', label: 'Contribution History' },
        { id: 'kin', label: 'Next of Kin' },
    ]

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[600px]">
            {}
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 px-6 py-2">
                <PremiumTabs 
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                />
            </div>

            {}
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
