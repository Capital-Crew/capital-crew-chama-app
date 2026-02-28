'use client'

import React from 'react';
import { CheckCircle2, XCircle, Clock, MessageSquareOff } from 'lucide-react';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'APOLOGY_APPROVED' | 'APOLOGY_REJECTED';

export interface AttendanceEntry {
    memberId: string;
    memberName: string;
    memberNumber: number;
    status: AttendanceStatus;
    minutesLate?: number;
    apologyStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

interface AttendanceGridProps {
    entries: AttendanceEntry[];
    onStatusChange: (memberId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => void;
    onMinutesLateChange: (memberId: string, minutes: number) => void;
}

export function AttendanceGrid({ entries, onStatusChange, onMinutesLateChange }: AttendanceGridProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.map((entry) => (
                            <tr key={entry.memberId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{entry.memberName}</span>
                                            {entry.apologyStatus && (
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${entry.apologyStatus === 'APPROVED' ? 'bg-indigo-100 text-indigo-700' :
                                                        entry.apologyStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    Apology: {entry.apologyStatus}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500">#{entry.memberNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={entry.status} minutesLate={entry.minutesLate} apologyStatus={entry.apologyStatus} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ActionButton
                                            active={entry.status === 'PRESENT'}
                                            color="green"
                                            icon={CheckCircle2}
                                            label="Present"
                                            onClick={() => onStatusChange(entry.memberId, 'PRESENT')}
                                        />
                                        <ActionButton
                                            active={entry.status === 'LATE'}
                                            color="yellow"
                                            icon={Clock}
                                            label="Late"
                                            onClick={() => onStatusChange(entry.memberId, 'LATE')}
                                        />
                                        <ActionButton
                                            active={entry.status === 'ABSENT'}
                                            color="red"
                                            icon={XCircle}
                                            label="Absent"
                                            onClick={() => onStatusChange(entry.memberId, 'ABSENT')}
                                        />

                                        {entry.status === 'LATE' && (
                                            <div className="flex items-center gap-2 ml-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                                                <span className="text-[10px] font-black uppercase text-yellow-600">Mins Late:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-16 bg-white px-2 py-0.5 text-sm font-bold border-2 border-yellow-200 rounded-lg outline-none focus:border-yellow-500"
                                                    value={entry.minutesLate || ''}
                                                    onChange={(e) => onMinutesLateChange(entry.memberId, parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status, minutesLate, apologyStatus }: { status: AttendanceStatus, minutesLate?: number, apologyStatus?: string | null }) {
    const configs: any = {
        PRESENT: { color: 'bg-green-100 text-green-700 border-green-200', text: 'Present' },
        ABSENT: {
            color: apologyStatus === 'APPROVED' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-red-100 text-red-700 border-red-200',
            text: apologyStatus === 'APPROVED' ? 'Absent (Apology Approved)' : 'Absent'
        },
        LATE: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: `Late (${minutesLate || 0}m)` },
        APOLOGY_APPROVED: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', text: 'Apology Approved' },
        APOLOGY_REJECTED: { color: 'bg-red-100 text-red-700 border-red-200', text: 'Apology Rejected' },
    };

    const config = configs[status] || configs.PRESENT;
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${config.color}`}>
            {config.text}
        </span>
    );
}

function ActionButton({ active, color, icon: Icon, label, onClick }: any) {
    const colorClasses: any = {
        green: active
            ? 'bg-green-600 text-white border-green-600 shadow-[0_4px_12px_rgba(22,163,74,0.3)]'
            : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700',
        yellow: active
            ? 'bg-yellow-500 text-white border-yellow-500 shadow-[0_4px_12px_rgba(234,179,8,0.3)]'
            : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700',
        red: active
            ? 'bg-red-600 text-white border-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.3)]'
            : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700',
        slate: active
            ? 'bg-slate-600 text-white border-slate-600 shadow-[0_4px_12px_rgba(71,85,105,0.3)]'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all duration-200
                ${colorClasses[color]}
                ${active ? 'scale-105 z-10' : 'opacity-70 hover:opacity-100'}
            `}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
