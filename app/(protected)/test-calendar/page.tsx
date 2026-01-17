'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function TestCalendarPage() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6">Calendar Test</h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-slate-400"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "MMMM d, yyyy") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {date && (
                        <div className="p-4 bg-cyan-50 rounded-lg">
                            <p className="text-sm font-medium text-cyan-900">
                                Selected: {format(date, "MMMM d, yyyy")}
                            </p>
                            <p className="text-xs text-cyan-700 mt-1">
                                ISO: {date.toISOString()}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={() => setDate(new Date())}
                        className="w-full"
                    >
                        Reset to Today
                    </Button>
                </div>
            </div>
        </div>
    )
}
