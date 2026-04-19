import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { syncGovernance, getGovernanceHealth } from '@/app/actions/approval-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function GovernanceHealth() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getGovernanceHealth();
            setRequests(data);
        } catch (error) {
            toast.error("Failed to load governance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async (id: string) => {
        setSyncing(id);
        try {
            const result = await syncGovernance(id);
            if (result.success) {
                toast.success("Governance synchronized and advanced successfully");
                await loadData();
            } else {
                toast.error(result.error || "No advancement possible: conditions not met");
            }
        } catch (error: any) {
            toast.error(error.message || "Sync failed");
        } finally {
            setSyncing(null);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Scanning Workflow Health...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Governance Health Terminal</h2>
                    <p className="text-sm text-slate-500">Monitor and synchronize pending workflow requests.</p>
                </div>
                <button 
                    onClick={loadData}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    title="Refresh List"
                >
                    <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className="grid gap-4">
                {requests.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <CheckCircle2 className="w-12 h-12 text-emerald-100 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">All Workflows are Healthy</p>
                        <p className="text-xs text-slate-400 mt-1">No pending requests requiring synchronization found.</p>
                    </div>
                ) : (
                    requests.map((req) => {
                        const isLoan = req.type === 'LOAN';
                        const quorumMet = (req.governance?.eligibleVotes || 0) >= (req.governance?.quorumRequired || 1);
                        const roleMet = !isLoan || req.governance?.hasPrivilegedRole;
                        const canSync = quorumMet && roleMet;

                        return (
                            <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-blue-100 transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider">
                                                {req.type}
                                            </span>
                                            <span className="text-sm font-bold text-slate-800">
                                                {req.entityDetails?.loanApplicationNumber || req.entityDetails?.memberNumber || req.id.slice(-6).toUpperCase()}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-slate-300" />
                                            <span className="text-xs font-medium text-slate-500">
                                                Stage: {req.currentStage?.name || req.stage}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-700">{req.description}</h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Requested by {req.requesterName} • {format(new Date(req.createdAt), 'MMM d, h:mm a')}
                                        </p>

                                        {/* Status Indicators */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border",
                                                quorumMet 
                                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                                    : "bg-amber-50 border-amber-100 text-amber-700"
                                            )}>
                                                {quorumMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                Quorum: {req.governance?.eligibleVotes || 0}/{req.governance?.quorumRequired || 1}
                                            </div>

                                            {isLoan && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border",
                                                    roleMet 
                                                        ? "bg-blue-50 border-blue-100 text-blue-700" 
                                                        : "bg-red-50 border-red-100 text-red-700"
                                                )}>
                                                    {roleMet ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                                                    {roleMet ? "Board Role Present" : "Board Approval Missing"}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={() => handleSync(req.id)}
                                            disabled={!!syncing}
                                            className={cn(
                                                "p-3 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50",
                                                canSync 
                                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" 
                                                    : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                                            )}
                                            title={canSync ? "Force Synchronize & Advance" : "Criteria not met yet"}
                                        >
                                            {syncing === req.id ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-6 h-6" />
                                            )}
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sync</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            {requests.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="text-xs text-amber-700 leading-relaxed">
                            <p className="font-bold mb-1">About Governance Sync</p>
                            This tool re-evaluates pending requests against current system settings. 
                            If a request satisfies both the <strong>Quorum</strong> and <strong>Privileged Role</strong> criteria, 
                            clicking Sync will officially finalize the current stage and advance the workflow.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
