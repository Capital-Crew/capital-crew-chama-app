'use client'

import React, { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Calendar, AlertCircle, Wallet, CheckCircle2, Clock, TrendingDown, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { payPenalty } from '@/app/actions/meeting-actions'
import Link from 'next/link'

interface UpcomingMeeting {
    id: string
    title: string
    date: Date
    status: string
}

interface PendingFine {
    id: string
    amount: number
    reason: string
    meeting: { title: string; date: Date } | null
    createdAt: Date
}

interface MeetingsHubProps {
    upcomingMeetings: UpcomingMeeting[]
    pendingFines: PendingFine[]
}

export function MeetingsHub({ upcomingMeetings, pendingFines }: MeetingsHubProps) {
    const [fines, setFines] = useState(pendingFines)
    const [isPending, startTransition] = useTransition()
    const [payingId, setPayingId] = useState<string | null>(null)

    const totalPending = fines.reduce((acc, f) => acc + f.amount, 0)

    const handlePayFine = (fineId: string) => {
        setPayingId(fineId)
        startTransition(async () => {
            const res = await payPenalty(fineId)
            if (res.success) {
                toast.success('Penalty paid from wallet!')
                setFines(prev => prev.filter(f => f.id !== fineId))
            } else {
                toast.error(('error' in res ? res.error : null) || 'Failed to pay penalty')
            }
            setPayingId(null)
        })
    }


    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl px-8 py-10 text-white shadow-xl">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Meetings</h1>
                        <p className="text-indigo-100 text-sm font-medium mt-0.5">Upcoming meetings, apologies &amp; attendance penalties</p>
                    </div>
                    <Link
                        href="/meetings/apology"
                        className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-50 transition-all active:scale-95"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Submit Apology
                    </Link>
                </div>
            </div>

            {/* Pending Penalties Banner */}
            {fines.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 rounded-xl">
                            <TrendingDown className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-black text-amber-900 text-sm">Outstanding Penalties</p>
                            <p className="text-amber-700 text-xs font-medium">You have {fines.length} unpaid fine{fines.length > 1 ? 's' : ''} totalling <strong>KES {totalPending.toLocaleString()}</strong></p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Meetings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-black text-slate-900">Upcoming Meetings</h2>
                    </div>

                    {upcomingMeetings.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-semibold text-sm">No upcoming meetings scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingMeetings.map(meeting => {
                                const meetingDate = new Date(meeting.date)
                                const daysUntil = Math.ceil((meetingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                const apologyDeadline = daysUntil > 3

                                return (
                                    <div key={meeting.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center border border-indigo-100">
                                                    <span className="text-[9px] font-black uppercase text-indigo-400">{format(meetingDate, 'MMM')}</span>
                                                    <span className="text-lg font-black text-indigo-900 leading-none">{format(meetingDate, 'd')}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-sm">{meeting.title}</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">{format(meetingDate, 'EEEE, MMMM d, yyyy')}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className={`text-[10px] font-black ${daysUntil <= 3 ? 'text-orange-600' : 'text-slate-400'}`}>
                                                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days away`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {apologyDeadline ? (
                                                <Link
                                                    href="/meetings/apology"
                                                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all"
                                                >
                                                    <MessageSquare className="w-3 h-3" />
                                                    Apology
                                                </Link>
                                            ) : (
                                                <span className="flex-shrink-0 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-[10px] font-black">
                                                    Deadline Passed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                {/* Penalties Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-black text-slate-900">My Penalties</h2>
                    </div>

                    {fines.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                            <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-semibold text-sm">No outstanding penalties — great attendance!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fines.map(fine => (
                                <div key={fine.id} className="bg-white border border-red-100 rounded-2xl p-5 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 text-sm">{fine.meeting?.title || 'Meeting Fine'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 italic">{fine.reason}</p>
                                            {fine.meeting && (
                                                <p className="text-[10px] text-slate-400 mt-1">{format(new Date(fine.meeting.date), 'MMMM d, yyyy')}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className="font-black text-red-600 text-sm">KES {fine.amount.toLocaleString()}</span>
                                            <button
                                                onClick={() => handlePayFine(fine.id)}
                                                disabled={isPending && payingId === fine.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black hover:bg-red-700 transition-all disabled:opacity-60 active:scale-95"
                                            >
                                                {isPending && payingId === fine.id ? (
                                                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                                ) : (
                                                    <Wallet className="w-3 h-3" />
                                                )}
                                                Pay from Wallet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
