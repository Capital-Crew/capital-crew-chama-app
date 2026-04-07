'use client'

import React, { useState, useEffect } from 'react';
import { getSaccoSettings, updateSaccoSettings } from '@/app/sacco-settings-actions';
import { UserRightsTable } from '@/components/admin/UserRightsTable';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';
import { Settings, DollarSign, Users, Shield, CheckCircle, TrendingUp, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumTabs } from './shared/PremiumTabs';
import { useFormAction } from '@/hooks/useFormAction';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormError } from '@/components/ui/FormError';

interface SettingsProps {
    users?: any[];
    modules?: any[];
    permissions?: any[];
    expenseAccounts?: any[];
}

export function UserRightsManagementModule({ users = [], modules = [], permissions = [], expenseAccounts = [] }: SettingsProps) {
    const [activeTab, setActiveTab] = useState('rights');
    const [saccoSettings, setSaccoSettings] = useState<any>(null);
    const { isPending: loading, error, execute, setError } = useFormAction();
    const [settingsForm, setSettingsForm] = useState({
        loanMultiplier: 3.0,
        processingFeePercent: 2.0,
        insuranceFeePercent: 1.0,
        contributionBoost: 500,
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

    // Load SACCO settings when that tab is active
    useEffect(() => {
        if (activeTab === 'sacco') {
            getSaccoSettings().then(settings => {
                setSaccoSettings(settings);
                setSettingsForm({
                    loanMultiplier: Number(settings.loanMultiplier),
                    processingFeePercent: Number(settings.processingFeePercent),
                    insuranceFeePercent: Number(settings.insuranceFeePercent),
                    contributionBoost: Number(settings.contributionBoost),
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
        
        await execute(async () => {
            await updateSaccoSettings(formData);
            const updated = await getSaccoSettings();
            setSaccoSettings(updated);
            toast.success("SACCO settings updated successfully");
            return { success: true };
        });
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
            {}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-8 py-12 rounded-2xl shadow-xl mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative flex items-center gap-4 mb-3 z-10">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner border border-white/10">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-3xl font-black tracking-tight text-white drop-shadow-sm">User Rights Management</h1>
                        <p className="text-purple-50 mt-1 font-medium text-xs md:text-lg opacity-90">Configure system access levels and SACCO parameters</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm inline-block mb-8 sticky top-4 z-40 backdrop-blur-md bg-white/90">
                <PremiumTabs 
                    tabs={[
                        { id: 'rights', label: 'User Rights', icon: Shield },
                        { id: 'sacco', label: 'SACCO Settings', icon: Settings },
                        { id: 'access', label: 'Access Control', icon: Shield }
                    ]}
                    activeTab={activeTab}
                    onChange={handleTabChange}
                />
            </div>

            {}
            <div className="space-y-6">
                {}
                {activeTab === 'rights' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">User Access Control</h2>
                            <p className="text-slate-500 text-sm">
                                Manage access levels and permissions for all system users.
                                Assign specific roles like Treasurer or Secretary to grant elevated privileges.
                            </p>
                        </div>
                        <UserRightsTable users={users} permissions={permissions} />
                    </div>
                )}

                {}
                {activeTab === 'sacco' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">SACCO Configuration</h2>
                            <p className="text-slate-600 mt-1">Fine-tune financial parameters and approval workflows</p>
                        </div>

                        <FormError message={error} className="mb-6" />

                        {saccoSettings ? (
                            <form onSubmit={handleSaccoSettingsSubmit} className="space-y-6 step-container">
                                {}
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
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Application Fee (%)</label>
                                                <input
                                                    name="processingFeePercent"
                                                    type="number"
                                                    step="0.1"
                                                    defaultValue={settingsForm.processingFeePercent}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Top-up Fee (%)</label>
                                                <input
                                                    name="refinanceFeePercentage"
                                                    type="number"
                                                    step="0.1"
                                                    defaultValue={saccoSettings.refinanceFeePercentage || 5.0}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Users className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Approval Workflow</h3>
                                                <p className="text-sm text-slate-600">Set required votes for system actions</p>
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
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Welfare Approvals</label>
                                                <input
                                                    name="requiredWelfareApprovals"
                                                    type="number"
                                                    min="1"
                                                    defaultValue={settingsForm.requiredWelfareApprovals}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Contribution & Penalties</h3>
                                                <p className="text-sm text-slate-600">Configure monthly requirements and meeting penalties</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Monthly Contribution (KES)</label>
                                                <input
                                                    name="monthlyContributionAmount"
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={settingsForm.monthlyContributionAmount}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Absent Penalty (KES)</label>
                                                <input
                                                    name="penaltyAbsentAmount"
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={settingsForm.penaltyAbsentAmount}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Late Penalty (KES)</label>
                                                <input
                                                    name="penaltyLateAmount"
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={settingsForm.penaltyLateAmount}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Scale className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Ledger Mapping</h3>
                                                <p className="text-sm text-slate-600">Assign GL accounts for penalties and fees</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Income Ledger (Revenue)</label>
                                                <select
                                                    name="meetingFeesGlId"
                                                    defaultValue={settingsForm.meetingFeesGlId}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                >
                                                    <option value="">Select an Account</option>
                                                    {expenseAccounts?.filter((acc: any) => acc.type === 'REVENUE').map((acc: any) => (
                                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-slate-700">Receivable Ledger (Asset)</label>
                                                <select
                                                    name="meetingReceivableGlId"
                                                    defaultValue={settingsForm.meetingReceivableGlId}
                                                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                                                >
                                                    <option value="">Select an Account</option>
                                                    {expenseAccounts?.filter((acc: any) => acc.type === 'ASSET').map((acc: any) => (
                                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SubmitButton
                                    isPending={loading}
                                    label="Save Configuration"
                                    pendingLabel="Saving..."
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all"
                                    icon={<CheckCircle className="w-5 h-5" />}
                                />
                            </form>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-slate-200">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-medium">Loading SACCO settings...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {}
                {activeTab === 'access' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Advanced Access Control</h2>
                            <p className="text-slate-600 mt-1">Configure granular module access permissions for each role.</p>
                        </div>
                        <PermissionsMatrix modules={modules} initialPermissions={permissions} />
                    </div>
                )}
            </div>
        </div>
    );
}
