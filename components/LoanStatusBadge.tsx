import React from 'react'

type LoanStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DISBURSED' | 'ACTIVE' | 'CLEARED' | 'OVERDUE' | 'REJECTED' | 'CANCELLED'

interface LoanStatusBadgeProps {
    status: LoanStatus
    size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
    PENDING_APPROVAL: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: '⏳',
        animation: 'animate-pulse'
    },
    APPROVED: {
        label: 'Approved',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: '✓',
        animation: ''
    },
    DISBURSED: {
        label: 'Disbursed',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: '💰',
        animation: ''
    },
    ACTIVE: {
        label: 'Active',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: '✓',
        animation: ''
    },
    CLEARED: {
        label: 'Cleared',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: '✓✓',
        animation: ''
    },
    OVERDUE: {
        label: 'Overdue',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: '⚠️',
        animation: 'animate-pulse'
    },
    REJECTED: {
        label: 'Rejected',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: '✗',
        animation: ''
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: '⊗',
        animation: ''
    }
}

const sizeConfig = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
}

export function LoanStatusBadge({ status, size = 'md' }: LoanStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig['PENDING_APPROVAL']

    return (
        <span
            className={`
                inline-flex items-center gap-1.5 
                rounded-full font-black uppercase tracking-wider
                border transition-all
                ${config.color}
                ${sizeConfig[size]}
                ${config.animation}
            `}
        >
            <span className="text-sm">{config.icon}</span>
            {config.label}
        </span>
    )
}
