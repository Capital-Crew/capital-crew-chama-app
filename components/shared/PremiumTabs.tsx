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
        <ul className={cn("flex flex-wrap text-sm font-medium text-center text-body", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon

                if (tab.disabled) {
                    return (
                        <li key={tab.id}>
                            <span className="inline-block px-4 py-3 text-fg-disabled cursor-not-allowed flex items-center gap-2">
                                {Icon && <Icon className="w-4 h-4" />}
                                {tab.label}
                            </span>
                        </li>
                    )
                }

                return (
                    <li key={tab.id} className="me-2">
                        <button
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2.5 transition-all duration-200 rounded-base",
                                isActive
                                    ? "text-white bg-brand shadow-sm font-bold"
                                    : "hover:text-heading hover:bg-neutral-secondary-soft text-body"
                            )}
                        >
                            {Icon && <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />}
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span className={cn(
                                    "text-[10px] rounded-full px-1.5 py-0.5 min-w-[1.25rem]",
                                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
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
