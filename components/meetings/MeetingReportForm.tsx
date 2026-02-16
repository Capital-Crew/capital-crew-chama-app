'use client'

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceGrid, AttendanceEntry, AttendanceStatus } from './AttendanceGrid';
import { submitMeetingReport } from '@/app/actions/meeting-actions';

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
        if (!file) {
            toast.error('Please upload meeting minutes (PDF)');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload file via the API we created
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await fetch('/api/upload/minutes', {
                method: 'POST',
                body: uploadFormData
            });

            if (!uploadRes.ok) {
                const error = await uploadRes.json();
                throw new Error(error.error || 'File upload failed');
            }

            const { url: minutesUrl } = await uploadRes.json();

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
                        <div className="relative">
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50/50 transition-all font-medium uppercase"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-700">Upload Minutes (PDF)</label>
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

            {/* Section C: Summary Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 md:p-6 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Attendance Overall</span>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-sm font-bold text-slate-800">Present: <span className="text-green-600">{stats.PRESENT}</span></span>
                                <span className="text-sm font-bold text-slate-800">Late: <span className="text-yellow-600">{stats.LATE}</span></span>
                                <span className="text-sm font-bold text-slate-800">Absent: <span className="text-red-600">{stats.ABSENT}</span></span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden md:block" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Penalties</span>
                            <span className="text-lg font-black text-slate-900">KES {stats.estimatedPenalties.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 ${isSubmitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-6 h-6 animate-spin" /> Posting...</>
                        ) : (
                            <><CheckCircle2 className="w-6 h-6" /> Post Report</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
