'use client'

import { useState } from 'react'
import { WalletDashboard } from '@/components/WalletDashboard'
import { WalletTransactionHistory } from '@/components/WalletTransactionHistory'
import { WalletOperations } from '@/components/wallet/WalletOperations'

export function WalletPageClient({ memberId, userRole }: { memberId: string; userRole?: string }) {
    const [refreshKey, setRefreshKey] = useState(0)
    const [lastTransactionWait, setLastTransactionWait] = useState(0) // Used to force refresh

    const handleTransactionComplete = () => {
        // Force refresh of dashboard content
        setLastTransactionWait(Date.now())
        setRefreshKey(prev => prev + 1)
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            {}
            <div>
                <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">Wallet</span>
                </h1>
                <p className="text-slate-500 font-medium">Manage your personal finances, savings, and transactions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {}
                <div className="lg:col-span-7 space-y-8">
                    {}
                    <WalletDashboard key={`dash-${refreshKey}`} memberId={memberId} />

                    {}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <span className="w-1 h-6 bg-slate-900 rounded-full"></span>
                                Recent Activity
                            </h2>
                        </div>
                        <WalletTransactionHistory key={`hist-${refreshKey}`} memberId={memberId} />
                    </div>
                </div>

                {}
                <div className="lg:col-span-5 sticky top-6">
                    <div className="bg-white/50 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative">
                        {}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-10"></div>

                        <WalletOperations
                            memberId={memberId}
                            userRole={userRole}
                            onTransactionComplete={handleTransactionComplete}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
