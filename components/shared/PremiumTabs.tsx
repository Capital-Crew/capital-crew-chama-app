'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface TabOption {
    id: string
    label: string
    badge?: number | string
    disabled?: boolean
    icon?: React.ComponentType<{ className?: string }>
}

interface PremiumTabsProps {
    tabs: TabOption[]
    activeTab: string
    onChange: (id: string) => void
    className?: string
}

export function PremiumTabs({ tabs, activeTab, onChange, className }: PremiumTabsProps) {
    return (
        <ul className={cn("flex items-center gap-1", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon

                if (tab.disabled) {
                    return (
                        <li key={tab.id}>
                            <span className="inline-block px-6 py-2.5 text-slate-400 cursor-not-allowed flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                                {Icon && <Icon className="w-3.5 h-3.5" />}
                                {tab.label}
                            </span>
                        </li>
                    )
                }

                return (
                    <li key={tab.id}>
                        <button
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "inline-flex items-center gap-2 px-6 py-2.5 transition-all duration-300 rounded-[18px] font-black text-[11px] uppercase tracking-wider",
                                isActive
                                    ? "text-[#0F172A] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-[1.02]"
                                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/40"
                            )}
                        >
                            {Icon && <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#4F46E5]" : "text-[#64748B]")} />}
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span className={cn(
                                    "text-[9px] rounded-full px-1.5 py-0.5 min-w-[1.25rem] font-bold",
                                    isActive ? "bg-[#4F46E5] text-white" : "bg-slate-200 text-slate-500"
                                )}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}
