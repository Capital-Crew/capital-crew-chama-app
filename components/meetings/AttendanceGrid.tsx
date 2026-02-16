'use client'

import React from 'react';
import { CheckCircle2, XCircle, Clock, MessageSquareOff } from 'lucide-react';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'APOLOGY';

export interface AttendanceEntry {
    memberId: string;
    memberName: string;
    memberNumber: number;
    status: AttendanceStatus;
    minutesLate?: number;
}

interface AttendanceGridProps {
    entries: AttendanceEntry[];
    onStatusChange: (memberId: string, status: AttendanceStatus) => void;
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
                                        <span className="font-bold text-slate-900">{entry.memberName}</span>
                                        <span className="text-xs text-slate-500">#{entry.memberNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={entry.status} minutesLate={entry.minutesLate} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
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
                                        <ActionButton
                                            active={entry.status === 'APOLOGY'}
                                            color="slate"
                                            icon={MessageSquareOff}
                                            label="Apology"
                                            onClick={() => onStatusChange(entry.memberId, 'APOLOGY')}
                                        />

                                        {entry.status === 'LATE' && (
                                            <div className="ml-4 flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500">Mins:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-16 px-2 py-1 text-sm border-2 border-slate-200 rounded-lg outline-none focus:border-yellow-500"
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

function StatusBadge({ status, minutesLate }: { status: AttendanceStatus, minutesLate?: number }) {
    const configs = {
        PRESENT: { color: 'bg-green-100 text-green-700 border-green-200', text: 'Present' },
        ABSENT: { color: 'bg-red-100 text-red-700 border-red-200', text: 'Absent' },
        LATE: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: `Late (${minutesLate || 0}m)` },
        APOLOGY: { color: 'bg-slate-100 text-slate-700 border-slate-200', text: 'Apology' },
    };

    const config = configs[status];
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-black border ${config.color}`}>
            {config.text}
        </span>
    );
}

function ActionButton({ active, color, icon: Icon, label, onClick }: any) {
    const colorClasses: any = {
        green: active ? 'bg-green-500 text-white border-green-500 shadow-green-200' : 'bg-white text-green-600 border-green-200 hover:bg-green-50',
        yellow: active ? 'bg-yellow-500 text-white border-yellow-500 shadow-yellow-200' : 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50',
        red: active ? 'bg-red-500 text-white border-red-500 shadow-red-200' : 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        slate: active ? 'bg-slate-500 text-white border-slate-500 shadow-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
    };

    return (
        <button
            onClick={onClick}
            title={label}
            className={`p-2 rounded-lg border-2 transition-all duration-200 shadow-sm ${colorClasses[color]} ${active ? 'shadow-md scale-105' : 'hover:scale-105'}`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
