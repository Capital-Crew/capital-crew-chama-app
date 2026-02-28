'use client'

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarLucide, FileText, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceGrid, AttendanceEntry, AttendanceStatus } from './AttendanceGrid';
import { processMeetingAttendance } from '@/app/actions/meeting-actions';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { format, parse } from 'date-fns';

interface MeetingReportFormProps {
    meetings: { id: string; title: string; date: Date; status: string }[];
    members: { id: string; name: string; memberNumber: number; userId: string | null; apologyStatus: string | null }[];
    settings: {
        penaltyAbsentAmount: number;
        penaltyLateAmount: number;
    };
}

export function MeetingReportForm({ meetings, members, settings }: MeetingReportFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState('');

    // Filter out meetings already processed or not completed
    const availableMeetings = meetings.filter(m => m.status === 'COMPLETED');

    // Initialize attendance entries (Default: All Present)
    const [attendance, setAttendance] = useState<AttendanceEntry[]>(
        members.map(m => ({
            memberId: m.id,
            memberName: m.name,
            memberNumber: m.memberNumber,
            userId: m.userId || '',
            status: 'PRESENT',
            minutesLate: 0,
            apologyStatus: m.apologyStatus as any
        }))
    );

    const handleStatusChange = (memberId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setAttendance(prev => prev.map(entry =>
            entry.memberId === memberId ? { ...entry, status } : entry
        ));
    };

    const handleMinutesLateChange = (memberId: string, minutes: number) => {
        setAttendance(prev => prev.map(entry =>
            entry.memberId === memberId ? { ...entry, minutesLate: minutes } : entry
        ));
    };

    const stats = useMemo(() => {
        const counts = {
            PRESENT: 0,
            ABSENT: 0,
            LATE: 0,
            APOLOGY_APPROVED: 0,
            APOLOGY_REJECTED: 0
        };
        attendance.forEach(a => {
            if (a.status === 'ABSENT' && a.apologyStatus === 'APPROVED') {
                counts.APOLOGY_APPROVED++;
            } else if (a.status === 'ABSENT' && a.apologyStatus === 'REJECTED') {
                counts.APOLOGY_REJECTED++;
            } else {
                counts[a.status as keyof typeof counts]++;
            }
        });

        const estimatedPenalties = (counts.ABSENT * settings.penaltyAbsentAmount) +
            (counts.APOLOGY_REJECTED * settings.penaltyAbsentAmount) +
            (counts.LATE * settings.penaltyLateAmount);

        return { ...counts, estimatedPenalties };
    }, [attendance, settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeetingId) {
            toast.error('Please select a meeting');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await processMeetingAttendance({
                meetingId: selectedMeetingId,
                attendance: attendance.map(a => ({
                    userId: a.userId,
                    status: a.status as any,
                    minutesLate: a.minutesLate
                }))
            });

            if (result.success) {
                toast.success('Attendance processed and penalties posted!');
                router.push('/dashboard');
            } else {
                throw new Error(result.error || 'Failed to process attendance');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {/* Section A: Selection */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-cyan-50 rounded-2xl">
                        <CalendarLucide className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Meeting Selection</h2>
                        <p className="text-sm text-slate-500">Select a completed meeting to process attendance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Select Meeting</label>
                        <select
                            required
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50/50 transition-all font-medium"
                            value={selectedMeetingId}
                            onChange={(e) => setSelectedMeetingId(e.target.value)}
                        >
                            <option value="">-- Choose Completed Meeting --</option>
                            {availableMeetings.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.title} ({format(new Date(m.date), 'dd MMM yyyy')})
                                </option>
                            ))}
                        </select>
                        {availableMeetings.length === 0 && (
                            <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> No meetings ready for processing. Meetings must be "COMPLETED" and in the past.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Section B: Attendance Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Attendance Report</h2>
                        <p className="text-sm text-slate-500">Toggle exceptions (Default: All Present)</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs font-black uppercase text-slate-400">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Present</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Late</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Absent</div>
                    </div>
                </div>

                <AttendanceGrid
                    entries={attendance}
                    onStatusChange={handleStatusChange}
                    onMinutesLateChange={handleMinutesLateChange}
                />
            </div>

            {/* Section C: Summary Footer (Ultra Compact) */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 z-40 shadow-2xl border border-white/10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-white">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-400">Attendance</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold"><span className="text-green-400">P:{stats.PRESENT}</span></span>
                                <span className="text-[10px] font-bold"><span className="text-yellow-400">L:{stats.LATE}</span></span>
                                <span className="text-[10px] font-bold"><span className="text-red-400">A:{stats.ABSENT}</span></span>
                                <span className="text-[10px] font-bold"><span className="text-indigo-400">Ap:{stats.APOLOGY_APPROVED}</span></span>
                            </div>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-400">Est. Penalties</span>
                            <span className="text-xs font-black text-amber-400 underline decoration-dotted">KES {stats.estimatedPenalties.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedMeetingId}
                        className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-sm shadow-2xl transition-all ${isSubmitting || !selectedMeetingId ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 active:scale-95 hover:shadow-cyan-500/20'}`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> PROCESSING...</>
                        ) : (
                            <><CheckCircle2 className="w-5 h-5" /> POST ATTENDANCE</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
