
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
import { LoanAdjustmentModal } from '@/components/admin/LoanAdjustmentModal';
import { postLoanAdjustment } from '@/app/actions/loan-adjustment-actions';
import { Settings, DollarSign, Users, TrendingUp, Shield, CheckCircle, XCircle, Edit, Package, HeartHandshake, Mail, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { WelfareTypeManager } from '@/components/welfare/WelfareTypeManager'
import { AdminRequisitionList } from '@/components/welfare/AdminRequisitionList'
import { NotificationSettings } from '@/components/admin/NotificationSettings'
import { UserRightsTable } from '@/components/admin/UserRightsTable'
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix'
import { MobileDrawer } from '@/components/ui/MobileDrawer';
import { BookOpen, ExternalLink, MessageSquareText } from 'lucide-react';
import { MeetingApologyManager } from '@/components/meetings/MeetingApologyManager';


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
        welfareCurrentBalance: 0,
        monthlyContributionAmount: 2000,
        latePaymentPenalty: 200,
        penaltyAbsentAmount: 500,
        penaltyLateAmount: 200,
        meetingFeesGlId: '',
        meetingReceivableGlId: ''
    });

    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

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
                    requiredWelfareApprovals: Number(settings.requiredWelfareApprovals) || 3,
                    welfareMonthlyContribution: Number(settings.welfareMonthlyContribution) || 0,
                    welfareCurrentBalance: Number(settings.welfareCurrentBalance) || 0,
                    monthlyContributionAmount: Number(settings.monthlyContributionAmount) || 2000,
                    latePaymentPenalty: Number(settings.latePaymentPenalty) || 200,
                    penaltyAbsentAmount: Number(settings.penaltyAbsentAmount) || 500,
                    penaltyLateAmount: Number(settings.penaltyLateAmount) || 200,
                    meetingFeesGlId: settings.meetingFeesGlId || '',
                    meetingReceivableGlId: settings.meetingReceivableGlId || ''
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
        { id: 'access', label: 'Access Control', icon: Shield },
        { id: 'engines', label: 'Engine Health', icon: TrendingUp },
        { id: 'products', label: 'Loan Products', icon: Package },
        { id: 'adjustments', label: 'Loan Adjustments', icon: Scale },
        { id: 'sacco', label: 'SACCO Settings', icon: Settings },
        { id: 'welfare', label: 'Welfare', icon: HeartHandshake },
        { id: 'notifications', label: 'Notifications', icon: Mail },
        { id: 'rights', label: 'User Rights', icon: Shield },
        { id: 'apologies', label: 'Meeting Apologies', icon: MessageSquareText }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
            {/* Modern Header with Gradient and Blur Effects */}
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-indigo-600 text-white px-8 py-12 rounded-2xl shadow-xl mb-8">
                {/* Decorative Blur Circles */}
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

            {/* Modern Tab Navigation - Scrollable on Mobile */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-8 sticky top-4 z-40 backdrop-blur-md bg-white/90">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
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

            {/* Adjustments Tab */}
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

                            {/* Contribution Settings Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Contribution Settings</h3>
                                            <p className="text-sm text-slate-600">Monthly contribution requirements and penalties</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Monthly Contribution Amount (KES)</label>
                                            <input
                                                name="monthlyContributionAmount"
                                                type="number"
                                                step="0.01"
                                                defaultValue={settingsForm.monthlyContributionAmount}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                            <p className="text-xs text-slate-500">Required contribution per member per month</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Late Payment Penalty (KES)</label>
                                            <input
                                                name="latePaymentPenalty"
                                                type="number"
                                                step="0.01"
                                                defaultValue={settingsForm.latePaymentPenalty}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                            <p className="text-xs text-slate-500">Penalty applied when contribution is missed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting & Penalty Settings Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Scale className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Meeting & Penalty Configuration</h3>
                                            <p className="text-sm text-slate-600">Set penalty rates and income account allocation</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Absent Penalty (KES)</label>
                                            <input
                                                name="penaltyAbsentAmount"
                                                type="number"
                                                step="0.01"
                                                defaultValue={settingsForm.penaltyAbsentAmount}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Late Penalty (KES)</label>
                                            <input
                                                name="penaltyLateAmount"
                                                type="number"
                                                step="0.01"
                                                defaultValue={settingsForm.penaltyLateAmount}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Income Ledger for Fees</label>
                                            <select
                                                name="meetingFeesGlId"
                                                defaultValue={settingsForm.meetingFeesGlId}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            >
                                                <option value="">Select an Account</option>
                                                {expenseAccounts?.filter((acc: any) => acc.type === 'REVENUE' || acc.type === 'INCOME').map((acc: any) => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code} - {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-500">GL account where meeting penalties will be credited (Revenue)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Receivable Ledger for Fees</label>
                                            <select
                                                name="meetingReceivableGlId"
                                                defaultValue={settingsForm.meetingReceivableGlId}
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                            >
                                                <option value="">Select an Account</option>
                                                {expenseAccounts?.filter((acc: any) => acc.type === 'ASSET' || acc.type === 'RECEIVABLE').map((acc: any) => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code} - {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-500">Asset account where unpaid meeting penalties will be tracked (Receivable)</p>
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
                    <UserRightsTable users={users} permissions={permissions} />
                </div>
            )}

            {/* Meeting Apologies Tab */}
            {activeTab === 'apologies' && (
                <div className="space-y-6">
                    <MeetingApologyManager apologies={apologies} />
                </div>
            )}

            {/* Access Control Tab */}
            {activeTab === 'access' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Access Control</h2>
                        <p className="text-slate-600 mt-1">Configure module access permissions for each role.</p>
                    </div>
                    <PermissionsMatrix modules={modules} initialPermissions={permissions} />
                </div>
            )}

            {/* Loan Adjustment Modal */}
            <LoanAdjustmentModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                onAdjustmentSubmit={handleAdjustmentSubmit}
            />

            {/* Modal (Desktop Only) */}
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

            {/* Mobile Drawer (Mobile Only) */}
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
