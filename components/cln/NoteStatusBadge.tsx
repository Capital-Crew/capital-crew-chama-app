import React from 'react';
import { cn } from '@/lib/utils';
import { LoanNoteStatus } from '@prisma/client';

interface NoteStatusBadgeProps {
  status: LoanNoteStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_APPROVAL: {
    label: 'Verification Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]'
  },
  OPEN: {
    label: 'Investment Active',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_2px_10px_rgba(16,185,129,0.1)] animate-pulse'
  },
  CLOSED: {
    label: 'Funding Secured',
    className: 'bg-slate-100 text-slate-600 border-slate-200'
  },
  ACTIVE: {
    label: 'Revenue Phase',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-[0_2px_10px_rgba(79,70,229,0.1)]'
  },
  MATURED_AND_SETTLED: {
    label: 'Settled & Closed',
    className: 'bg-violet-50 text-violet-700 border-violet-200'
  },
  RECALLED: {
    label: 'Issuer Recall',
    className: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  REJECTED: {
    label: 'Compliance Denied',
    className: 'bg-slate-50 text-slate-400 border-slate-200'
  },
  UNDER_SUBSCRIBED: {
    label: 'Awaiting Volume',
    className: 'bg-orange-50 text-orange-700 border-orange-200'
  }
};

export function NoteStatusBadge({ status, className }: NoteStatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status.replace(/_/g, ' '), 
    className: 'bg-slate-50 text-slate-500 border-slate-200' 
  };

  return (
    <div className={cn(
      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
      config.className,
      className
    )}>
      {config.label}
    </div>
  );
}
