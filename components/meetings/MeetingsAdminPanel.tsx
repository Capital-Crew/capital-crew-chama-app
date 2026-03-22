'use client'

import React, { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { CalendarPlus, CheckCircle2, XCircle, Clock, ChevronRight, AlertTriangle, Plus, Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { createMeeting, updateMeetingStatus } from '@/app/actions/meeting-actions'
import { DatePickerField } from '@/components/ui/date-picker-field'
import Link from 'next/link'

type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

interface Meeting {
    id: string
    title: string
    date: Date
    status: MeetingStatus
    isPenaltiesProcessed: boolean
    _count?: { attendees: number; apologies: number; fines: number }
}

interface MeetingsAdminPanelProps {
    meetings: Meeting[]
}

const STATUS_STYLES: Record<MeetingStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
}

const STATUS_ICONS: Record<MeetingStatus, React.ReactNode> = {
    SCHEDULED: <Clock className="w-3 h-3" />,
    COMPLETED: <CheckCircle2 className="w-3 h-3" />,
    CANCELLED: <XCircle className="w-3 h-3" />,
}

export function MeetingsAdminPanel({ meetings: initialMeetings }: MeetingsAdminPanelProps) {
    const [meetings, setMeetings] = useState(initialMeetings)
    const [showForm, setShowForm] = useState(false)
    const [formTitle, setFormTitle] = useState('')
    const [formDate, setFormDate] = useState<Date | undefined>(undefined)
    const [isPending, startTransition] = useTransition()

    const handleCreate = () => {
        if (!formTitle.trim() || !formDate) {
            toast.error('Please enter a title and select a date')
            return
        }
        startTransition(async () => {
            const res = await createMeeting({ title: formTitle, date: formDate })
            if (res.success && res.meeting) {
                toast.success('Meeting scheduled!')
                setMeetings(prev => [{ ...res.meeting!, _count: { attendees: 0, apologies: 0, fines: 0 } } as Meeting, ...prev])
                setFormTitle('')
                setFormDate(undefined)
                setShowForm(false)
            } else {
                toast.error(res.error || 'Failed to create meeting')
            }
        })
    }

    const handleStatusChange = (meetingId: string, newStatus: MeetingStatus) => {
        startTransition(async () => {
            const res = await updateMeetingStatus(meetingId, newStatus)
            if (res.success) {
                toast.success(`Meeting marked as ${newStatus.toLowerCase()}`)
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status: newStatus } : m))
            } else {
                toast.error(res.error || 'Failed to update meeting')
            }
        })
    }

    const upcoming = meetings.filter(m => m.status === 'SCHEDULED')
    const past = meetings.filter(m => m.status !== 'SCHEDULED')

    return (
        <div className="space-y-8">
            {}
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-indigo-700 rounded-3xl px-8 py-10 text-white shadow-xl">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
                            <Activity className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Meeting Management</h1>
                            <p className="text-cyan-100 text-sm font-medium mt-0.5">Schedule, track, and process member meetings</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="flex items-center gap-2 bg-white text-cyan-700 px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-cyan-50 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Schedule Meeting
                    </button>
                </div>
            </div>

            {}
            {showForm && (
                <div className="bg-white rounded-3xl border-2 border-cyan-200 shadow-lg p-8 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-50 rounded-xl">
                            <CalendarPlus className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">New Meeting</h2>
                            <p className="text-xs text-slate-500">Fill in the details to schedule a meeting</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Meeting Title</label>
                            <input
                                type="text"
                                placeholder="e.g. January Monthly Meeting"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Meeting Date</label>
                            <DatePickerField
                                value={formDate}
                                onChange={setFormDate}
                                placeholder="Select date"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleCreate}
                            disabled={isPending}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-cyan-700 transition-all disabled:opacity-60 active:scale-95"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Confirm Schedule
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {}
            <section className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Upcoming / Scheduled</h2>
                {upcoming.length === 0 ? (
                    <EmptyState message="No scheduled meetings. Use 'Schedule Meeting' to add one." />
                ) : (
                    <div className="space-y-3">
                        {upcoming.map(m => (
                            <MeetingCard
                                key={m.id}
                                meeting={m}
                                onStatusChange={handleStatusChange}
                                isPending={isPending}
                            />
                        ))}
                    </div>
                )}
            </section>

            {}
            <section className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Past Meetings</h2>
                {past.length === 0 ? (
                    <EmptyState message="No past meetings yet." />
                ) : (
                    <div className="space-y-3">
                        {past.map(m => (
                            <MeetingCard
                                key={m.id}
                                meeting={m}
                                onStatusChange={handleStatusChange}
                                isPending={isPending}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function MeetingCard({ meeting, onStatusChange, isPending }: {
    meeting: Meeting
    onStatusChange: (id: string, status: MeetingStatus) => void
    isPending: boolean
}) {
    const isPast = new Date(meeting.date) < new Date()

    return (
        <div className={`bg-white border-2 rounded-2xl p-6 transition-all hover:shadow-md ${meeting.status === 'CANCELLED' ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    {}
                    <div className="flex-shrink-0 w-14 h-14 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{format(new Date(meeting.date), 'MMM')}</span>
                        <span className="text-xl font-black text-slate-900 leading-none">{format(new Date(meeting.date), 'd')}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-900">{meeting.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${STATUS_STYLES[meeting.status]}`}>
                                {STATUS_ICONS[meeting.status]}
                                {meeting.status}
                            </span>
                            {meeting.isPenaltiesProcessed && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider rounded-full">
                                    Processed
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{format(new Date(meeting.date), 'EEEE, MMMM d, yyyy · h:mm a')}</p>
                        {meeting._count && (
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>{meeting._count.attendees} attended</span>
                                <span>·</span>
                                <span>{meeting._count.apologies} apologies</span>
                                <span>·</span>
                                <span>{meeting._count.fines} fines</span>
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="flex flex-wrap items-center gap-2 md:flex-shrink-0">
                    {meeting.status === 'SCHEDULED' && isPast && !meeting.isPenaltiesProcessed && (
                        <button
                            onClick={() => onStatusChange(meeting.id, 'COMPLETED')}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border-2 border-green-200 rounded-xl font-bold text-xs hover:bg-green-100 transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Completed
                        </button>
                    )}
                    {meeting.status === 'COMPLETED' && !meeting.isPenaltiesProcessed && (
                        <Link
                            href="/meetings/report/new"
                            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-50 text-cyan-700 border-2 border-cyan-200 rounded-xl font-bold text-xs hover:bg-cyan-100 transition-all"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                            Process Attendance
                        </Link>
                    )}
                    {meeting.status === 'SCHEDULED' && (
                        <button
                            onClick={() => onStatusChange(meeting.id, 'CANCELLED')}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold text-sm">{message}</p>
        </div>
    )
}
