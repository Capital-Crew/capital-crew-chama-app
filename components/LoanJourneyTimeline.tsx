import React from 'react'

interface LoanJourneyEvent {
    id: string
    eventType: string
    description: string
    actorId: string | null
    actorName: string | null
    timestamp: Date
    metadata?: any
}

interface LoanJourneyTimelineProps {
    events: LoanJourneyEvent[]
}

const eventIcons: Record<string, string> = {
    APPLICATION_SUBMITTED: '📝',
    APPROVAL_RECEIVED: '✓',
    APPROVAL_REJECTED: '✗',
    LOAN_APPROVED: '👍',
    LOAN_REJECTED: '👎',
    LOAN_DISBURSED: '💰',
    REPAYMENT_MADE: '💵',
    PENALTY_APPLIED: '⚠️',
    LOAN_CLEARED: '✓✓',
    LOAN_RESCHEDULED: '📅',
    LOAN_TOPPED_UP: '⬆️'
}

const eventColors: Record<string, string> = {
    APPLICATION_SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-300',
    APPROVAL_RECEIVED: 'bg-green-100 text-green-700 border-green-300',
    APPROVAL_REJECTED: 'bg-red-100 text-red-700 border-red-300',
    LOAN_APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    LOAN_REJECTED: 'bg-gray-100 text-gray-700 border-gray-300',
    LOAN_DISBURSED: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    REPAYMENT_MADE: 'bg-purple-100 text-purple-700 border-purple-300',
    PENALTY_APPLIED: 'bg-orange-100 text-orange-700 border-orange-300',
    LOAN_CLEARED: 'bg-teal-100 text-teal-700 border-teal-300',
    LOAN_RESCHEDULED: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    LOAN_TOPPED_UP: 'bg-pink-100 text-pink-700 border-pink-300'
}

export function LoanJourneyTimeline({ events }: LoanJourneyTimelineProps) {
    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                No events recorded yet
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {events.map((event, index) => (
                <div key={event.id} className="flex gap-4 relative">
                    {/* Timeline Line */}
                    {index !== events.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-200" />
                    )}

                    {/* Icon Circle */}
                    <div className={`
                        relative z-10 flex-shrink-0 w-12 h-12 rounded-full 
                        flex items-center justify-center text-xl
                        border-2 shadow-sm
                        ${eventColors[event.eventType] || 'bg-slate-100 text-slate-700 border-slate-300'}
                    `}>
                        {eventIcons[event.eventType] || '•'}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                                    {event.eventType.replace(/_/g, ' ')}
                                </h4>
                                <p className="text-xs text-slate-600 mt-1">
                                    {event.description}
                                </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                {new Date(event.timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        {event.actorName && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black">
                                    By:
                                </span>
                                <span className="text-xs text-slate-700 font-bold">
                                    {event.actorName}
                                </span>
                            </div>
                        )}

                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <details className="text-[10px] text-slate-500">
                                    <summary className="cursor-pointer font-bold uppercase tracking-wider">
                                        Details
                                    </summary>
                                    <pre className="mt-2 bg-slate-50 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(event.metadata, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
