'use client'

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarLucide, FileText, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceGrid, AttendanceEntry, AttendanceStatus } from './AttendanceGrid';
import { submitMeetingReport } from '@/app/actions/meeting-actions';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { format, parse } from 'date-fns';

interface MeetingReportFormProps {
    members: { id: string; name: string; memberNumber: number }[];
    settings: {
        penaltyAbsentAmount: number;
        penaltyLateAmount: number;
    };
}

export function MeetingReportForm({ members, settings }: MeetingReportFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
    });

    // Initialize attendance entries (Default: All Present)
    const [attendance, setAttendance] = useState<AttendanceEntry[]>(
        members.map(m => ({
            memberId: m.id,
            memberName: m.name,
            memberNumber: m.memberNumber,
            status: 'PRESENT',
            minutesLate: 0
        }))
    );

    const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
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
            APOLOGY: 0
        };
        attendance.forEach(a => counts[a.status]++);

        const estimatedPenalties = (counts.ABSENT * settings.penaltyAbsentAmount) + (counts.LATE * settings.penaltyLateAmount);

        return { ...counts, estimatedPenalties };
    }, [attendance, settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {
            let minutesUrl = '';

            // 1. Upload file if selected
            if (file) {
                try {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);

                    const uploadRes = await fetch('/api/upload/minutes', {
                        method: 'POST',
                        body: uploadFormData
                    });

                    if (!uploadRes.ok) {
                        const errorData = await uploadRes.json();
                        throw new Error(errorData.error || 'File upload failed');
                    }

                    const { url } = await uploadRes.json();
                    minutesUrl = url;
                } catch (uploadError: any) {
                    console.error('Minutes Upload Failed:', uploadError);
                    toast.warning(`Minutes upload failed: ${uploadError.message}. Proceeding with attendance report only.`);
                    // We continue even if upload fails as per user request to decouple
                }
            }

            // 2. Submit report data
            const result = await submitMeetingReport({
                title: formData.title,
                date: formData.date,
                minutesUrl,
                attendance: attendance.map(a => ({
                    memberId: a.memberId,
                    status: a.status,
                    minutesLate: a.minutesLate
                }))
            });

            if (result.success) {
                toast.success('Meeting report finalized and penalties recorded!');
                router.push('/dashboard');
            } else {
                throw new Error(result.error || 'Failed to submit report');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {/* Section A: Details */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-cyan-50 rounded-2xl">
                        <FileText className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Meeting Details</h2>
                        <p className="text-sm text-slate-500">Provide basic information and upload minutes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Meeting Title</label>
                        <input
                            required
                            placeholder="e.g. Annual General Meeting 2026"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50/50 transition-all font-medium"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Meeting Date</label>
                        <DatePickerField
                            value={formData.date ? parse(formData.date, 'yyyy-MM-dd', new Date()) : undefined}
                            onChange={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                            placeholder="Select meeting date"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-700">Upload Minutes (Optional PDF)</label>
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${file ? 'border-green-400 bg-green-50/30' : 'border-slate-300 hover:border-cyan-400 bg-slate-50/50'}`}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <div className="p-3 bg-green-100 rounded-full mb-3">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <span className="font-bold text-slate-900">{file.name}</span>
                                    <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="p-3 bg-slate-100 rounded-full mb-3">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <span className="font-bold text-slate-700">Click to upload or drag & drop</span>
                                    <span className="text-xs text-slate-500">PDF documents only, max 10MB</span>
                                </div>
                            )}
                        </div>
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
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Apology</div>
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
                            </div>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-400">Total Penalty</span>
                            <span className="text-xs font-black">KES {stats.estimatedPenalties.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-sm shadow-2xl transition-all ${isSubmitting ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 active:scale-95 hover:shadow-cyan-500/20'}`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> POSTING...</>
                        ) : (
                            <><CheckCircle2 className="w-5 h-5" /> POST REPORT</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
