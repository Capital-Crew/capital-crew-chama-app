'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
    /** Currently selected date */
    value: Date | undefined
    /** Called when the user selects a date */
    onChange: (date: Date | undefined) => void
    /** Optional label displayed above the trigger */
    label?: string
    /** Placeholder text when no date is selected */
    placeholder?: string
    /** Additional className for the trigger button */
    className?: string
    /** Additional className for the label */
    labelClassName?: string
    /** Whether the field is disabled */
    disabled?: boolean
    /** Date display format (default: PPP e.g. "January 1, 2026") */
    displayFormat?: string
    /** Minimum year for the year dropdown */
    fromYear?: number
    /** Maximum year for the year dropdown */
    toYear?: number
}

export function DatePickerField({
    value,
    onChange,
    label,
    placeholder = 'Pick a date',
    className,
    labelClassName,
    disabled = false,
    displayFormat = 'PPP',
    fromYear = 2020,
    toYear = 2030,
}: DatePickerFieldProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <div className="space-y-1.5">
            {label && (
                <span className={cn(
                    "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 block",
                    labelClassName
                )}>
                    {label}
                </span>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700",
                            "bg-white dark:bg-slate-800 text-sm font-medium text-left",
                            "outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-all",
                            "hover:border-slate-300 dark:hover:border-slate-600",
                            !value && "text-slate-400 dark:text-slate-500",
                            value && "text-slate-900 dark:text-white",
                            disabled && "opacity-50 cursor-not-allowed",
                            className,
                        )}
                    >
                        <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span className="flex-1 truncate">
                            {value ? format(value, displayFormat) : placeholder}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        selected={value}
                        onSelect={(date) => {
                            onChange(date)
                            setOpen(false)
                        }}
                        defaultMonth={value}
                        fromYear={fromYear}
                        toYear={toYear}
                        className="rounded-lg"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
