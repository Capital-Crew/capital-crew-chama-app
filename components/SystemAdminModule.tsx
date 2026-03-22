
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoanProduct } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { createLoanProduct } from '@/app/actions';
import { getSaccoSettings, updateSaccoSettings } from '@/app/sacco-settings-actions';
import { toggleMemberApprovalRight } from '@/app/loan-approval-actions';
import { LoanManagement } from '@/components/LoanManagement';
import { toggleLoanProductStatus } from '@/app/actions/loan-product';
import { EngineHealthDashboard } from '@/components/EngineHealthDashboard';
import { LoanAdjustmentModal } from '@/components/admin/LoanAdjustmentModal';
import { postLoanAdjustment } from '@/app/actions/loan-adjustment-actions';
import { Settings, DollarSign, Users, TrendingUp, Shield, CheckCircle, XCircle, Edit, Package, HeartHandshake, Mail, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { WelfareTypeManager } from '@/components/welfare/WelfareTypeManager'
import { AdminRequisitionList } from '@/components/welfare/AdminRequisitionList'
import { NotificationSettings } from '@/components/admin/NotificationSettings'
import { MobileDrawer } from '@/components/ui/MobileDrawer';
import { BookOpen, ExternalLink, MessageSquareText } from 'lucide-react';
import { MeetingApologyManager } from '@/components/meetings/MeetingApologyManager';
import { PremiumTabs } from './shared/PremiumTabs';


interface Member {
    id: string;
    name: string;
    memberNumber: number;
    canApproveLoan: boolean;
}

interface SettingsProps {
    products: LoanProduct[];
    members?: Member[];
    welfareTypes?: any[];
    welfareRequisitions?: any[];
    expenseAccounts?: any[];
    users?: any[]; // Passed from page
    modules?: any[];
    permissions?: any[];
    apologies?: any[];
}

export function SystemAdminModule({ products, members = [], welfareTypes = [], welfareRequisitions = [], expenseAccounts = [], users = [], modules = [], permissions = [], apologies = [] }: SettingsProps) {
    const [activeTab, setActiveTab] = useState('products');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

    const handleToggleApprovalRight = async (memberId: string) => {
        await toggleMemberApprovalRight(memberId);
        window.location.reload();
    };

    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'DEACTIVATE' : 'ACTIVATE'} this product?`)) {
            await toggleLoanProductStatus(productId, !currentStatus);
        }
    };

    const handleAdjustmentSubmit = async (data: any) => {
        try {
            await postLoanAdjustment(data);
            toast.success("Adjustment posted successfully");
            setIsAdjustmentModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to post adjustment");
        }
    };

    const tabs = [
        { id: 'engines', label: 'Engine Health', icon: TrendingUp },
        { id: 'products', label: 'Loan Products', icon: Package },
        { id: 'adjustments', label: 'Loan Adjustments', icon: Scale },
        { id: 'welfare', label: 'Welfare', icon: HeartHandshake },
        { id: 'notifications', label: 'Notifications', icon: Mail },
        { id: 'apologies', label: 'Meeting Apologies', icon: MessageSquareText }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
            {}
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-indigo-600 text-white px-8 py-12 rounded-2xl shadow-xl mb-8">
                {}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative flex items-center gap-4 mb-3 z-10">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner border border-white/10">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-3xl font-black tracking-tight text-white drop-shadow-sm">System Administration</h1>
                        <p className="text-cyan-50 mt-1 font-medium text-xs md:text-lg opacity-90">Manage loan products, SACCO parameters, and user rights</p>
                    </div>
                </div>
            </div>

            {}
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-8 sticky top-4 z-40 backdrop-blur-md bg-white/90 inline-block overflow-x-auto max-w-full">
                <PremiumTabs 
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {}
            {activeTab === 'engines' && (
                <EngineHealthDashboard />
            )}

            {}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Loan Products</h2>
                            <p className="text-slate-600 mt-1">Manage and configure your loan product offerings</p>
                        </div>
                        <Link
                            href="/admin/products/create"
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            Create Product
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(p => (
                            <div
                                key={p.id}
                                className={`group bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all duration-300 overflow-hidden ${!p.isActive ? 'opacity-60' : ''
                                    }`}
                            >
                                {}
                                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 border-b border-slate-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Package className="w-5 h-5 text-cyan-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                                        </div>
                                        {!p.isActive && (
                                            <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold uppercase rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                        {p.isActive && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    {}
                                    <div className="flex items-baseline gap-2">
                                        <TrendingUp className="w-4 h-4 text-cyan-600" />
                                        <span className="text-sm font-medium text-slate-600">Monthly Rate:</span>
                                        <span className="text-2xl font-bold text-cyan-600">{String(p.interestRatePerPeriod)}%</span>
                                    </div>
                                </div>

                                {}
                                <div className="p-6 flex gap-3">
                                    <button
                                        onClick={() => handleToggleStatus(p.id, p.isActive)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${p.isActive
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100 border-2 border-green-200'
                                            }`}
                                    >
                                        {p.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        {p.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <Link
                                        href={`/admin/products/${p.id}/edit`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 px-4 py-2.5 rounded-lg font-semibold text-sm border-2 border-cyan-200 transition-all duration-200"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No loan products yet</h3>
                            <p className="text-slate-600 mb-6">Get started by creating your first loan product</p>
                            <Link
                                href="/admin/products/create"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl transition-all"
                            >
                                <PlusCircleIcon className="w-5 h-5" />
                                Create Product
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {}
            {activeTab === 'adjustments' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Loan Adjustments</h2>
                            <p className="text-slate-600 mt-1">Manually adjust loan balances (Penalties, Waivers, Corrections)</p>
                        </div>
                        <button
                            onClick={() => setIsAdjustmentModalOpen(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200"
                        >
                            <Scale className="w-5 h-5" />
                            New Adjustment
                        </button>
                    </div>

                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Scale className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Adjustments</h3>
                        <p className="text-slate-600 max-w-md mx-auto mb-8">
                            Use this tool to post manual penalties, waive charges, or correct system errors.
                            All adjustments are audited and will reflect in the General Ledger.
                        </p>
                        <button
                            onClick={() => setIsAdjustmentModalOpen(true)}
                            className="inline-flex items-center gap-2 text-cyan-600 font-bold hover:text-cyan-700 hover:underline"
                        >
                            Post Adjustment Now &rarr;
                        </button>
                    </div>
                </div>
            )}

            {}
            {activeTab === 'welfare' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Welfare Administration</h2>
                        <p className="text-slate-600 mt-1">Manage welfare types, approvals, and disbursements</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold mb-4">Requisitions & Approvals</h3>
                        <AdminRequisitionList requisitions={welfareRequisitions} />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <WelfareTypeManager welfareTypes={welfareTypes} accounts={expenseAccounts} />
                    </div>
                </div>
            )}


            {}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Notification Settings</h2>
                        <p className="text-slate-600 mt-1">Manage email alerts and mailing lists</p>
                    </div>
                    <NotificationSettings />
                </div>
            )}

            {}
            <LoanAdjustmentModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                onAdjustmentSubmit={handleAdjustmentSubmit}
            />

            {}
            {isModalOpen && (
                <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Create New Product</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form action={async (fd) => { await createLoanProduct(fd); setIsModalOpen(false); }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Product Name</label>
                                <input name="name" required placeholder="e.g. Emergency Loan" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Default Principal</label>
                                <input name="principal" required type="number" placeholder="50000" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Interest Rate (%)</label>
                                    <input name="interestRatePerPeriod" required type="number" step="0.01" placeholder="1.5" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Interest Type</label>
                                    <div className="relative">
                                        <select name="interestType" className="w-full appearance-none bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all">
                                            <option value="FLAT">Flat Rate</option>
                                            <option value="DECLINING_BALANCE">Declining Balance</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                    <PlusCircleIcon className="w-5 h-5" />
                                    Create Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {}
            <MobileDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Product"
            >
                <form action={async (fd) => { await createLoanProduct(fd); setIsModalOpen(false); }} className="space-y-5 pb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Product Name</label>
                        <input name="name" required placeholder="e.g. Emergency Loan" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Default Principal</label>
                        <input name="principal" required type="number" placeholder="50000" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Interest Rate (%)</label>
                            <input name="interestRatePerPeriod" required type="number" step="0.01" placeholder="1.5" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Interest Type</label>
                            <div className="relative">
                                <select name="interestType" className="w-full appearance-none bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all">
                                    <option value="FLAT">Flat Rate</option>
                                    <option value="DECLINING_BALANCE">Declining Balance</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" />
                            Create Product
                        </button>
                    </div>
                </form>
            </MobileDrawer>
        </div>
    );
}
