'use client';

import React, { useState } from 'react';
import { updateStageSettings } from '@/app/actions/workflow-settings';
import { toast } from '@/lib/toast';

interface WorkflowSettingsClientProps {
    workflows: any[];
}

export function WorkflowSettingsClient({ workflows }: WorkflowSettingsClientProps) {
    const [updating, setUpdating] = useState<string | null>(null);

    const handleUpdate = async (stageId: string, newValue: number) => {
        if (newValue < 1) return;
        setUpdating(stageId);
        try {
            await updateStageSettings(stageId, newValue);
            toast.success("Stage threshold updated successfully");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="grid gap-6">
            {workflows.map((wf) => (
                <div key={wf.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-black uppercase">
                                {wf.entityType}
                            </span>
                            {wf.name}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">{wf.description}</p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {wf.stages.map((stage: any) => (
                            <div key={stage.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                                        {stage.stepNumber}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-700">{stage.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                                Role: {stage.requiredRole}
                                            </span>
                                            {stage.isFinal && (
                                                <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px]">
                                                    Final Stage
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        Votes Required:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            defaultValue={stage.minVotesRequired}
                                            className="w-16 p-2 rounded-lg border border-slate-200 font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val !== stage.minVotesRequired) {
                                                    handleUpdate(stage.id, val);
                                                }
                                            }}
                                            disabled={!!updating}
                                        />
                                        {updating === stage.id && (
                                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {workflows.length === 0 && (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No workflows found. They will be auto-generated when used.</p>
                </div>
            )}
        </div>
    );
}
