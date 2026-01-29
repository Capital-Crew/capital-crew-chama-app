import React from 'react'
import { AutoSaveStatus } from '@/hooks/useFormAutoSave'

interface AutoSaveIndicatorProps {
    status: AutoSaveStatus
    lastSaved: Date | null
    error: string | null
}

export function AutoSaveIndicator({ status, lastSaved, error }: AutoSaveIndicatorProps) {
    if (status === 'idle' && !lastSaved) return null

    const getStatusDisplay = () => {
        switch (status) {
            case 'saving':
                return (
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                        <span className="text-xs font-bold">Saving...</span>
                    </div>
                )
            case 'saved':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold">Saved</span>
                    </div>
                )
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-600" title={error || 'Save failed'}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold">Auto-save failed</span>
                    </div>
                )
            default:
                if (lastSaved) {
                    const timeAgo = getTimeAgo(lastSaved)
                    return (
                        <div className="flex items-center gap-2 text-slate-500">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium">Saved {timeAgo}</span>
                        </div>
                    )
                }
                return null
        }
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
            {getStatusDisplay()}
        </div>
    )
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return date.toLocaleDateString()
}
