'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Save, X, Plus, Trash2, User, Phone, Link2, Percent, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/toast';

interface NextOfKinData {
    id?: string;
    fullName: string;
    relationship: string;
    phoneNumber: string;
    allocation: number;
    nationality?: string;
    altPhone?: string;
}

interface NextOfKinManagerProps {
    initialData: NextOfKinData[];
    memberId: string;
}

const RELATIONSHIPS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'];

export function NextOfKinManager({ initialData, memberId }: NextOfKinManagerProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(initialData.length === 0);
    const [beneficiaries, setBeneficiaries] = useState<NextOfKinData[]>(
        initialData.length > 0 ? initialData : [{
            fullName: '',
            relationship: 'SPOUSE',
            phoneNumber: '',
            allocation: 0,
            nationality: 'KE',
            altPhone: ''
        }]
    );
    const [isLoading, setIsLoading] = useState(false);

    // Calculate total allocation
    const totalAllocation = beneficiaries.reduce((sum, b) => sum + Number(b.allocation || 0), 0);
    const isValidAllocation = totalAllocation === 100;
    const isUnderAllocated = totalAllocation < 100;
    const isOverAllocated = totalAllocation > 100;

    const addBeneficiary = () => {
        setBeneficiaries([...beneficiaries, {
            fullName: '',
            relationship: 'SPOUSE',
            phoneNumber: '',
            allocation: 0,
            nationality: 'KE',
            altPhone: ''
        }]);
    };

    const removeBeneficiary = (index: number) => {
        if (beneficiaries.length === 1) {
            toast.error('You must have at least one beneficiary');
            return;
        }
        setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
    };

    const updateBeneficiary = (index: number, field: keyof NextOfKinData, value: any) => {
        const updated = [...beneficiaries];
        updated[index] = { ...updated[index], [field]: value };
        setBeneficiaries(updated);
    };

    const handleSave = async () => {
        if (!isValidAllocation) {
            toast.error('Total allocation must equal 100%');
            return;
        }

        // Validate all fields
        for (const b of beneficiaries) {
            if (!b.fullName || !b.phoneNumber || !b.allocation) {
                toast.error('Please fill in all required fields');
                return;
            }
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/next-of-kin/save-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, beneficiaries })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Beneficiaries saved successfully');
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to save beneficiaries');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setBeneficiaries(initialData.length > 0 ? initialData : [{
            fullName: '',
            relationship: 'SPOUSE',
            phoneNumber: '',
            allocation: 0,
            nationality: 'KE',
            altPhone: ''
        }]);
        setIsEditing(false);
    };

    // Summary Mode
    if (!isEditing && initialData.length > 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Beneficiaries & Next of Kin</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${isOverAllocated ? 'bg-red-500' : totalAllocation === 100 ? 'bg-green-500' : 'bg-cyan-500'}`}
                                    style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                                />
                            </div>
                            <span className={`text-[10px] font-black uppercase ${isOverAllocated ? 'text-red-500' : totalAllocation === 100 ? 'text-green-600' : 'text-slate-400'}`}>
                                {totalAllocation}% Allocated
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-xs font-black text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-xl transition-all"
                    >
                        <Pencil className="w-4 h-4" /> Edit
                    </button>
                </div>

                {(isUnderAllocated || isOverAllocated) && (
                    <div className={`p-4 rounded-2xl border flex gap-3 ${isOverAllocated ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold leading-normal">
                            {isOverAllocated
                                ? `Critical: Total allocation exceeds 100% (${totalAllocation}%). Please reduce allocations.`
                                : `Note: Total allocation is currently ${totalAllocation}%. It is recommended to total exactly 100% for wealth distribution.`}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {initialData.map((kin, i) => (
                        <div key={kin.id || i} className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-cyan-100 hover:shadow-xl hover:shadow-cyan-500/5 transition-all">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                        <p className="text-sm font-black text-slate-800">{kin.fullName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Link2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relationship</p>
                                        <p className="text-sm font-black text-slate-800 uppercase italic opacity-70">{kin.relationship}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                        <p className="text-sm font-bold text-slate-600 font-mono tracking-tighter">{kin.phoneNumber}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <Percent className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocation</p>
                                        <p className="text-base font-black text-green-600">{Number(kin.allocation)}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Edit Mode or Empty State
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Edit Next of Kin</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${isOverAllocated ? 'bg-red-500' : isValidAllocation ? 'bg-green-500' : 'bg-cyan-500'}`}
                                style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                            />
                        </div>
                        <span className={`text-[10px] font-black uppercase ${isOverAllocated ? 'text-red-500' : isValidAllocation ? 'text-green-600' : 'text-slate-400'}`}>
                            {totalAllocation}% Allocated
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {initialData.length > 0 && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!isValidAllocation || isLoading}
                        className="bg-cyan-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>

            {!isValidAllocation && (
                <div className={`p-4 rounded-2xl border flex gap-3 ${isOverAllocated ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-normal">
                        {isOverAllocated
                            ? `Total allocation exceeds 100% (${totalAllocation}%). Please reduce allocations.`
                            : `Total allocation is ${totalAllocation}%. Must total exactly 100% to save.`}
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {beneficiaries.map((beneficiary, index) => (
                    <div key={index} className="bg-white border-2 border-cyan-100 rounded-2xl p-6 relative">
                        {beneficiaries.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeBeneficiary(index)}
                                className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        value={beneficiary.fullName}
                                        onChange={(e) => updateBeneficiary(index, 'fullName', e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</label>
                                <div className="relative">
                                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={beneficiary.relationship}
                                        onChange={(e) => updateBeneficiary(index, 'relationship', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10 appearance-none"
                                    >
                                        {RELATIONSHIPS.map(rel => (
                                            <option key={rel} value={rel}>{rel}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        value={beneficiary.phoneNumber}
                                        onChange={(e) => updateBeneficiary(index, 'phoneNumber', e.target.value)}
                                        placeholder="07... or 254..."
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocation (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={beneficiary.allocation || ''}
                                        onChange={(e) => updateBeneficiary(index, 'allocation', Number(e.target.value))}
                                        placeholder="e.g. 50"
                                        min="0"
                                        max="100"
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addBeneficiary}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-cyan-300 rounded-2xl p-6 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-600 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold text-sm">Add Another Beneficiary</span>
                </button>
            </div>
        </div>
    );
}
