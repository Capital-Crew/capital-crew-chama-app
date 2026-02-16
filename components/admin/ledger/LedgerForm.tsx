'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AccountType, NormalBalance } from '@prisma/client';
import { createLedgerAction } from '@/app/actions/ledger-actions';
import { toast } from 'sonner';
import { X, Save, AlertCircle } from 'lucide-react';

const ledgerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    code: z.string().min(1, "Code is required"),
    type: z.nativeEnum(AccountType),
    parentId: z.string().optional().nullable(),
    normalBalance: z.nativeEnum(NormalBalance),
    description: z.string().optional()
});

type LedgerFormData = z.infer<typeof ledgerSchema>;

interface LedgerFormProps {
    onClose: () => void;
    onSuccess: () => void;
    existingLedgers: any[];
}

export function LedgerForm({ onClose, onSuccess, existingLedgers }: LedgerFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LedgerFormData>({
        resolver: zodResolver(ledgerSchema),
        defaultValues: {
            type: AccountType.ASSET,
            normalBalance: NormalBalance.DEBIT,
            parentId: ''
        }
    });

    const selectedType = watch('type');
    const selectedParentId = watch('parentId');

    // Auto-set Normal Balance based on type
    React.useEffect(() => {
        if (selectedType === AccountType.ASSET || selectedType === AccountType.EXPENSE) {
            setValue('normalBalance', NormalBalance.DEBIT);
        } else {
            setValue('normalBalance', NormalBalance.CREDIT);
        }
    }, [selectedType, setValue]);

    const onSubmit = async (data: LedgerFormData) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value) formData.append(key, value);
            });

            await createLedgerAction(formData);
            toast.success("Ledger created in PENDING status. Needs approval.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to create ledger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const parents = existingLedgers.filter(l => l.type === selectedType);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-[#00c2e0] to-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="font-black text-xl tracking-tight">Setup New Ledger</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control w-full col-span-2">
                            <label className="label font-bold text-slate-700">Account Name</label>
                            <input
                                {...register('name')}
                                placeholder="e.g. Current Assets, Staff Salaries"
                                className={`input input-bordered w-full rounded-xl ${errors.name ? 'input-error' : ''}`}
                            />
                            {errors.name && <span className="text-xs text-rose-500 mt-1 font-bold">{errors.name.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">Account Category</label>
                            <select {...register('type')} className="select select-bordered w-full rounded-xl">
                                {Object.values(AccountType).filter(t => t !== 'INCOME').map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">Account Code</label>
                            <input
                                {...register('code')}
                                placeholder="e.g. 1001"
                                className={`input input-bordered w-full rounded-xl font-mono ${errors.code ? 'input-error' : ''}`}
                            />
                            {errors.code && <span className="text-xs text-rose-500 mt-1 font-bold">{errors.code.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">Parent Ledger (Optional)</label>
                            <select {...register('parentId')} className="select select-bordered w-full rounded-xl">
                                <option value="">Root Account</option>
                                {parents.map(p => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">Normal Balance</label>
                            <div className="flex gap-4 items-center h-12">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value={NormalBalance.DEBIT} {...register('normalBalance')} className="radio radio-primary radio-sm" />
                                    <span className="text-sm font-bold text-slate-600">Debit</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value={NormalBalance.CREDIT} {...register('normalBalance')} className="radio radio-primary radio-sm" />
                                    <span className="text-sm font-bold text-slate-600">Credit</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-control w-full col-span-2">
                            <label className="label font-bold text-slate-700">Description</label>
                            <textarea
                                {...register('description')}
                                className="textarea textarea-bordered h-24 rounded-xl"
                                placeholder="Purpose of this ledger account..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs leading-relaxed">
                            <span className="font-bold">Note:</span> New ledgers are created with <span className="font-black italic">PENDING</span> status.
                            A separate administrator must approve and activate them before they can accept postings.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost flex-1 rounded-xl"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary bg-[#00c2e0] border-none text-white flex-1 rounded-xl shadow-lg shadow-cyan-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <span className="loading loading-spinner"></span> : <Save className="w-4 h-4 mr-2" />}
                            Create Ledger
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
