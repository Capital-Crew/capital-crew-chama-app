
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoanProduct } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { createLoanProduct } from '@/app/actions';
import { getSaccoSettings, updateSaccoSettings } from '@/app/sacco-settings-actions';
import { toggleMemberApprovalRight } from '@/app/loan-approval-actions';
import { toggleLoanProductStatus } from '@/app/actions/loan-product';
import { PermissionControlPanel } from '@/components/PermissionControlPanel';
import { EngineHealthDashboard } from '@/components/EngineHealthDashboard';
import { Settings, DollarSign, Users, TrendingUp, Shield, CheckCircle, XCircle, Edit, Package, HeartHandshake, Mail } from 'lucide-react';
import { WelfareTypeManager } from '@/components/welfare/WelfareTypeManager'
import { AdminRequisitionList } from '@/components/welfare/AdminRequisitionList'
import { NotificationSettings } from '@/components/admin/NotificationSettings'
import { UserRightsTable } from '@/components/admin/UserRightsTable'


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
}

export function SystemAdminModule({ products, members = [], welfareTypes = [], welfareRequisitions = [], expenseAccounts = [], users = [] }: SettingsProps) {
    const [activeTab, setActiveTab] = useState('products');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saccoSettings, setSaccoSettings] = useState<any>(null);
    const [settingsForm, setSettingsForm] = useState({
        loanMultiplier: 3.0,
        processingFeePercent: 2.0,
        insuranceFeePercent: 1.0,
        shareCapitalBoost: 500,
        penaltyRate: 5.0,
        requiredApprovals: 3,
        requiredWelfareApprovals: 3,
        welfareMonthlyContribution: 0,
        welfareCurrentBalance: 0
    });

    // Load SACCO settings
    useEffect(() => {
        if (activeTab === 'sacco') {
            getSaccoSettings().then(settings => {
                setSaccoSettings(settings);
                setSettingsForm({
                    loanMultiplier: Number(settings.loanMultiplier),
                    processingFeePercent: Number(settings.processingFeePercent),
                    insuranceFeePercent: Number(settings.insuranceFeePercent),
                    shareCapitalBoost: Number(settings.shareCapitalBoost),
                    penaltyRate: Number(settings.penaltyRate) || 5.0,
                    requiredApprovals: Number(settings.requiredApprovals) || 3,
                    requiredWelfareApprovals: Number(settings.requiredWelfareApprovals) || 3, // Safe access if field missing
                    welfareMonthlyContribution: Number(settings.welfareMonthlyContribution) || 0,
                    welfareCurrentBalance: Number(settings.welfareCurrentBalance) || 0
                });
            });
        }
    }, [activeTab]);

    const handleSaccoSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await updateSaccoSettings(formData);
        const updated = await getSaccoSettings();
        setSaccoSettings(updated);
    };

    const handleToggleApprovalRight = async (memberId: string) => {
        await toggleMemberApprovalRight(memberId);
        window.location.reload();
    };

    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'DEACTIVATE' : 'ACTIVATE'} this product?`)) {
            await toggleLoanProductStatus(productId, !currentStatus);
        }
    };

    const tabs = [
        { id: 'engines', label: 'Engine Health', icon: TrendingUp },
        { id: 'products', label: 'Loan Products', icon: Package },
        { id: 'sacco', label: 'SACCO Settings', icon: Settings },
        { id: 'welfare', label: 'Welfare', icon: HeartHandshake },
        { id: 'notifications', label: 'Notifications', icon: Mail },
        { id: 'rights', label: 'User Rights', icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
            {/* Modern Header with Gradient */}
            <div className="bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 text-white px-8 py-12 rounded-2xl shadow-xl mb-8">
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Settings className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
                        <p className="text-cyan-50 mt-1">Manage loan products, SACCO parameters, and user rights</p>
                    </div>
                </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-8">
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Engine Health Tab */}
            {activeTab === 'engines' && (
                <EngineHealthDashboard />
            )}

            {/* Loan Products Tab */}
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
                                {/* Product Header with Gradient */}
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

                                    {/* Interest Rate Display */}
                                    <div className="flex items-baseline gap-2">
                                        <TrendingUp className="w-4 h-4 text-cyan-600" />
                                        <span className="text-sm font-medium text-slate-600">Monthly Rate:</span>
                                        <span className="text-2xl font-bold text-cyan-600">{String(p.interestRatePerPeriod)}%</span>
                                    </div>
                                </div>

                                {/* Product Actions */}
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

            {/* SACCO Settings Tab */}
            {activeTab === 'sacco' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">SACCO Configuration</h2>
                        <p className="text-slate-600 mt-1">Fine-tune financial parameters and approval workflows</p>
                    </div>

                    {saccoSettings && (
                        <form onSubmit={handleSaccoSettingsSubmit} className="space-y-6">
                            {/* Financial Settings Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <DollarSign className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Financial Settings</h3>
                                            <p className="text-sm text-slate-600">Configure fees and loan parameters</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Loan Limit Multiplier</label>
                                            <input
                                                name="loanMultiplier"
                                                type="number"
                                                step="0.1"
                                                defaultValue={settingsForm.loanMultiplier}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                            <p className="text-xs text-slate-500">Max loan = Contributions × Multiplier</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Application Fee (%)</label>
                                            <input
                                                name="processingFeePercent"
                                                type="number"
                                                step="0.1"
                                                defaultValue={settingsForm.processingFeePercent}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Top-up Fee (%)</label>
                                            <input
                                                name="refinanceFeePercentage"
                                                type="number"
                                                step="0.1"
                                                defaultValue={saccoSettings.refinanceFeePercentage || 5.0}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Workflow Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Users className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Approval Workflow</h3>
                                            <p className="text-sm text-slate-600">Set required votes for loan actions</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Votes for New Loan</label>
                                            <input
                                                name="requiredApprovals"
                                                type="number"
                                                min="1"
                                                max="10"
                                                defaultValue={settingsForm.requiredApprovals}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Welfare Settings Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            {/* Ideally import HeartHandshake or similar */}
                                            <Shield className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Welfare Configuration</h3>
                                            <p className="text-sm text-slate-600">Fund management and approval rules</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Monthly Contribution (KES)</label>
                                            <input
                                                name="welfareMonthlyContribution"
                                                type="number"
                                                step="0.01"
                                                defaultValue={settingsForm.welfareMonthlyContribution}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Welfare Fund Balance (Seed)</label>
                                            <input
                                                name="welfareCurrentBalance"
                                                type="number"
                                                step="0.01"
                                                defaultValue={settingsForm.welfareCurrentBalance}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                            <p className="text-xs text-slate-500">Initial balance setting (use cautiously)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Votes for Approval</label>
                                            <input
                                                name="requiredWelfareApprovals"
                                                type="number"
                                                min="1"
                                                defaultValue={settingsForm.requiredWelfareApprovals}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Save Configuration
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Welfare Tab */}
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



            {/* Notification Settings Tab */}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Notification Settings</h2>
                        <p className="text-slate-600 mt-1">Manage email alerts and mailing lists</p>
                    </div>
                    <NotificationSettings />
                </div>
            )}



            {/* User Rights Tab */}
            {activeTab === 'rights' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">User Rights Management</h2>
                        <p className="text-slate-500 text-sm">
                            Manage access levels and permissions for all system users.
                            Assign specific roles like Treasurer or Secretary to grant elevated privileges.
                        </p>
                    </div>
                    <UserRightsTable users={users} />
                </div>
            )}

            {/* Modal (kept as is) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">Create New Product</h3>
                        <form action={async (fd) => { await createLoanProduct(fd); setIsModalOpen(false); }} className="space-y-4">
                            <input name="name" placeholder="Product Name" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                            <input name="principal" type="number" placeholder="Default Principal" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                            <input name="interestRatePerPeriod" type="number" placeholder="Monthly Interest Rate (%)" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                            <select name="interestType" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all">
                                <option value="FLAT">Flat</option>
                                <option value="DECLINING_BALANCE">Declining</option>
                            </select>
                            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">Create Product</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-2">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
