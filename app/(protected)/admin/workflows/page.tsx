import React from 'react';
import { getWorkflowSettings, updateStageSettings } from '@/app/actions/workflow-settings';
import { WorkflowSettingsClient } from './WorkflowSettingsClient';
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { protectPage } from "@/lib/with-module-protection"

export default async function WorkflowSettingsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    const workflows = await getWorkflowSettings();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Workflow Configuration</h1>
                    <p className="text-slate-500">Manage approval stages and voting requirements.</p>
                </div>
            </div>

            <WorkflowSettingsClient workflows={workflows} />
        </div>
    );
}
