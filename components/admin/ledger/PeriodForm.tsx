'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { openAccountingPeriodAction } from '@/app/actions/accounting-period-actions';
import { toast } from 'sonner';
import { X, Calendar, Save, AlertCircle } from 'lucide-react';

const periodSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    memo: z.string().optional()
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"]
});

type PeriodFormData = z.infer<typeof periodSchema>;

interface PeriodFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function PeriodForm({ onClose, onSuccess }: PeriodFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<PeriodFormData>({
        resolver: zodResolver(periodSchema),
        defaultValues: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
        }
    });

    const onSubmit = async (data: PeriodFormData) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('startDate', data.startDate);
            formData.append('endDate', data.endDate);
            if (data.memo) formData.append('memo', data.memo);

            await openAccountingPeriodAction(formData);
            toast.success("New accounting period opened successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to open period");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="font-black text-xl tracking-tight flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Open Accounting Period
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">Start Date</label>
                            <input
                                type="date"
                                {...register('startDate')}
                                className={`input input-bordered w-full rounded-xl ${errors.startDate ? 'input-error' : ''}`}
                            />
                            {errors.startDate && <span className="text-xs text-rose-500 mt-1 font-bold">{errors.startDate.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">End Date</label>
                            <input
                                type="date"
                                {...register('endDate')}
                                className={`input input-bordered w-full rounded-xl ${errors.endDate ? 'input-error' : ''}`}
                            />
                            {errors.endDate && <span className="text-xs text-rose-500 mt-1 font-bold">{errors.endDate.message}</span>}
                        </div>

                        <div className="form-control w-full">
                            <label className="label font-bold text-slate-700">Memo / Notes</label>
                            <textarea
                                {...register('memo')}
                                className="textarea textarea-bordered h-24 rounded-xl"
                                placeholder="e.g. Q1 2026 Fiscal Period"
                            ></textarea>
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-3 text-indigo-800">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs leading-relaxed">
                            Opening a period allows transactions to be posted within this date range.
                            Ensure there are no overlaps with existing periods.
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
                            className="btn btn-primary bg-indigo-600 border-none text-white flex-1 rounded-xl shadow-lg shadow-indigo-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <span className="loading loading-spinner"></span> : <Save className="w-4 h-4 mr-2" />}
                            Open Period
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
