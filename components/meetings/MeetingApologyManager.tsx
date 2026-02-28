'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { resolveApology } from '@/app/actions/meeting-actions'
import { formatCurrency } from '@/lib/utils'

interface Apology {
    id: string;
    meetingId: string;
    meeting: {
        title: string;
        date: Date;
    };
    userId: string;
    user: {
        name: string | null;
        member: {
            memberNumber: number;
        } | null;
    };
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
}

interface MeetingApologyManagerProps {
    apologies: Apology[];
}

export function MeetingApologyManager({ apologies: initialApologies }: MeetingApologyManagerProps) {
    const [apologies, setApologies] = useState(initialApologies);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    const filteredApologies = apologies.filter(a => filter === 'ALL' || a.status === filter);

    const handleResolve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await resolveApology({ apologyId: id, status });
            if (res.success) {
                toast.success(`Apology ${status.toLowerCase()} successfully`);
                setApologies(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            } else {
                toast.error(res.error || 'Failed to resolve apology');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Meeting Apologies</h2>
                    <p className="text-slate-500 text-sm">Review and approve member apologies for upcoming meetings</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === t
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredApologies.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No {filter.toLowerCase()} apologies</h3>
                        <p className="text-slate-500">There are no meeting apologies matching your selection.</p>
                    </div>
                ) : (
                    filteredApologies.map((apology) => (
                        <div
                            key={apology.id}
                            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{apology.user.name || 'Unknown Member'}</h4>
                                                <p className="text-xs text-slate-500 font-medium">Member #{apology.user.member?.memberNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(apology.status)}`}>
                                            {getStatusIcon(apology.status)}
                                            {apology.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meeting</p>
                                                <p className="text-sm font-bold text-slate-700">{apology.meeting.title}</p>
                                                <p className="text-[10px] text-slate-500">{format(new Date(apology.meeting.date), 'PPPP')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="w-4 h-4 text-slate-400 mt-1" />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reason</p>
                                                <p className="text-sm text-slate-600 italic">"{apology.reason}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {apology.status === 'PENDING' && (
                                    <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                        <button
                                            onClick={() => handleResolve(apology.id, 'APPROVED')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleResolve(apology.id, 'REJECTED')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors border-2 border-red-200"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
