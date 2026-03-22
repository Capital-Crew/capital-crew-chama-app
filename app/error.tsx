'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [copied, setCopied] = useState(false)
    const isDev = process.env.NODE_ENV === 'development'

    // Log the error immediately on mount
    useEffect(() => {

        // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
    }, [error])

    const handleCopyDigest = async () => {
        if (!error.digest) return
        try {
            await navigator.clipboard.writeText(error.digest)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-lg">
                {}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                    {}
                    <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-400" />

                    <div className="p-8 space-y-6">
                        {}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center ring-4 ring-red-50 dark:ring-red-950/20">
                                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Something went wrong
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                {isDev
                                    ? error.message || 'An unexpected error occurred.'
                                    : 'An unexpected error occurred. Please try again or contact support if the issue persists.'}
                            </p>
                        </div>

                        {}
                        {error.digest && (
                            <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Error Reference
                                </p>
                                <div className="flex items-center justify-between gap-3">
                                    <code className="text-sm font-mono text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg truncate">
                                        {error.digest}
                                    </code>
                                    <button
                                        onClick={handleCopyDigest}
                                        className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Copy error reference"
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Share this code with support to help identify the issue.
                                </p>
                            </div>
                        )}

                        {}
                        {isDev && error.stack && (
                            <details className="group">
                                <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    Stack Trace (dev only)
                                </summary>
                                <pre className="mt-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-words">
                                    {error.stack}
                                </pre>
                            </details>
                        )}

                        {}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={reset}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Try Again
                            </button>
                            <a
                                href="/"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all active:scale-[0.98]"
                            >
                                Go Home
                            </a>
                        </div>
                    </div>
                </div>

                {}
                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
                    If this keeps happening, please contact your system administrator.
                </p>
            </div>
        </div>
    )
}
