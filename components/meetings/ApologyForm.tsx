'use client'

import React, { useState } from 'react';
import { Calendar, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitApology } from '@/app/actions/meeting-actions';
import { format } from 'date-fns';

interface ApologyFormProps {
    meetings: { id: string; title: string; date: Date }[];
}

export function ApologyForm({ meetings }: ApologyFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeetingId || !reason) {
            toast.error('Please select a meeting and provide a reason');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitApology({
                meetingId: selectedMeetingId,
                reason: reason
            });

            if (result.success) {
                toast.success('Apology submitted successfully!');
                setReason('');
                setSelectedMeetingId('');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit apology');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Submit Apology</h2>
                    <p className="text-sm text-slate-500 font-medium">For upcoming meetings (at least 3 days prior)</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Meeting</label>
                    <select
                        required
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all font-medium"
                        value={selectedMeetingId}
                        onChange={(e) => setSelectedMeetingId(e.target.value)}
                    >
                        <option value="">-- Choose Upcoming Meeting --</option>
                        {meetings.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.title} ({format(new Date(m.date), 'dd MMM yyyy')})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Reason for Apology</label>
                    <textarea
                        required
                        placeholder="e.g. Traveling for work, family emergency..."
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 min-h-[120px] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all font-medium resize-none"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !selectedMeetingId}
                    className={`
                        w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg
                        ${isSubmitting || !selectedMeetingId
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}
                    `}
                >
                    {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> SUBMITTING...</>
                    ) : (
                        <><Send className="w-5 h-5" /> SUBMIT APOLOGY</>
                    )}
                </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <strong>Deadline Rule:</strong> Apologies must be submitted at least <strong>3 days</strong> before the meeting date. Late submissions will not be accepted.
                </p>
            </div>
        </form>
    );
}
