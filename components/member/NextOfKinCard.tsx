'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Save, X, Phone, User, Link2, Percent } from 'lucide-react';
import { NextOfKinSchema, NextOfKinInput, NextOfKinRelationshipEnum } from '@/lib/validators/nok-schema';
import { updateNextOfKin } from '@/app/actions/update-nok';
import { toast } from '@/lib/toast';

interface NextOfKinCardProps {
    kin: any; // Using any for now to handle Prisma return
    memberId: string;
    initialIsEditing?: boolean;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function NextOfKinCard({ kin, memberId, initialIsEditing = false, onCancel, onSuccess }: NextOfKinCardProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<NextOfKinInput>({
        resolver: zodResolver(NextOfKinSchema) as any,
        defaultValues: kin ? {
            id: kin.id,
            fullName: kin.fullName,
            relationship: kin.relationship,
            phoneNumber: kin.phoneNumber,
            allocation: Number(kin.allocation),
            nationality: kin.nationality || 'KE',
            altPhone: kin.altPhone || '',
        } : {
            fullName: '',
            relationship: 'SPOUSE',
            phoneNumber: '',
            allocation: 0,
            nationality: 'KE',
            altPhone: '',
        }
    });

    const onSubmit = async (data: NextOfKinInput) => {
        setIsLoading(true);
        try {
            const result = await updateNextOfKin({ ...data, memberId });
            if (result.success) {
                toast.success("Next of Kin updated successfully");
                setIsEditing(false);
                router.refresh(); // Refresh server data
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Failed to update Next of Kin");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
        if (onCancel) onCancel();
    };

    if (isEditing) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white border-2 border-cyan-100 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Edit Next of Kin</h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-cyan-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-600 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                {...register('fullName')}
                                placeholder="Full Name"
                                className={`w-full bg-slate-50 border ${errors.fullName ? 'border-red-300 ring-red-50' : 'border-slate-100 focus:border-cyan-500'} rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10`}
                            />
                        </div>
                        {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</label>
                        <div className="relative">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                {...register('relationship')}
                                className={`w-full bg-slate-50 border ${errors.relationship ? 'border-red-300' : 'border-slate-100 focus:border-cyan-500'} rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10 appearance-none`}
                            >
                                {NextOfKinRelationshipEnum.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        {errors.relationship && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.relationship.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                {...register('phoneNumber')}
                                placeholder="07... or 254..."
                                className={`w-full bg-slate-50 border ${errors.phoneNumber ? 'border-red-300' : 'border-slate-100 focus:border-cyan-500'} rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10`}
                            />
                        </div>
                        {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phoneNumber.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocation (%)</label>
                        <div className="relative">
                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                {...register('allocation')}
                                type="number"
                                placeholder="e.g. 50"
                                className={`w-full bg-slate-50 border ${errors.allocation ? 'border-red-300' : 'border-slate-100 focus:border-cyan-500'} rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/10`}
                            />
                        </div>
                        {errors.allocation && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.allocation.message}</p>}
                    </div>
                </div>
            </form>
        );
    }

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 group relative transition-all hover:border-cyan-100 hover:shadow-xl hover:shadow-cyan-500/5">
            <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-cyan-50 rounded-lg text-cyan-600 transition-all duration-200"
            >
                <Pencil className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                        <p className="text-sm font-black text-slate-800">{kin.fullName || kin.name}</p>
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
                        <p className="text-sm font-bold text-slate-600 font-mono tracking-tighter">{kin.phoneNumber || kin.phone}</p>
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
    );
}
