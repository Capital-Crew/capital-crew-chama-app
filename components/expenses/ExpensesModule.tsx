'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { FileTextIcon, RefreshCw, Loader2 } from 'lucide-react'
import { getExpenses, getExpenseCategories } from '@/app/actions/expenses'
import { getStrictGLAccounts } from '@/app/actions/system-accounting'
import { getMembers } from '@/app/actions/get-members'
import { getCurrentUserPermissions } from '@/app/actions/user-permissions'
import { ExpensesTab } from '@/components/accounting/ExpensesTab'
import { toast } from '@/lib/toast'

export function ExpensesModule() {
    const [loading, setLoading] = useState(true)
    const [expenses, setExpenses] = useState<any[]>([])
    const [expenseCategories, setExpenseCategories] = useState<any[]>([])
    const [membersList, setMembersList] = useState<any[]>([])
    const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
    const [userAuth, setUserAuth] = useState<{ id: string, role: string, permissions: any } | null>(null)
    const [isPending, startTransition] = useTransition()

    const loadData = async () => {
        setLoading(true)
        try {
            const [expData, accData, catData, memData, authData] = await Promise.all([
                getExpenses(),
                getStrictGLAccounts(),
                getExpenseCategories(),
                getMembers(),
                getCurrentUserPermissions()
            ])
            setExpenses(expData)
            setChartOfAccounts(accData)
            setExpenseCategories(catData)
            setMembersList(memData)
            setUserAuth(authData)
        } catch (error: any) {
            toast.error(error.message || "Failed to load expenses data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center min-h-[400px] justify-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-cyan-500" />
                <p className="text-lg font-medium">Loading Sacco Expenses...</p>
                <p className="text-sm mt-1">Fetching real-time financial transparency data</p>
            </div>
        )
    }

    const isOfficial = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(userAuth?.role || '')

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 pb-1 mb-4 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Financial Transparency</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Expenses
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm md:text-base font-medium max-w-xl">
                            Track operational costs, reimbursements, and group expenditures with full audit trails.
                        </p>
                    </div>

                    <div className="flex shrink-0">
                        <button 
                            onClick={loadData}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 backdrop-blur-md"
                        >
                            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                            Sync Expenses
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-2 md:p-4">
                <ExpensesTab 
                    expenses={expenses}
                    accounts={chartOfAccounts}
                    categories={expenseCategories}
                    members={membersList}
                    currentUserId={userAuth?.id || ''}
                    currentUserRole={userAuth?.role || ''}
                    isOfficial={isOfficial}
                    onRefresh={loadData}
                />
            </div>
        </div>
    )
}
