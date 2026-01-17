'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationStore, NotificationPayload } from '@/lib/notification-store'
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

export function GlobalNotification() {
    const [notification, setNotification] = useState<NotificationPayload | null>(null)

    useEffect(() => {
        return notificationStore.subscribe((n) => {
            setNotification(n)

            // Auto dismiss if duration is set (and not loading)
            if (n && n.type !== 'loading' && n.duration !== Infinity) {
                const timer = setTimeout(() => {
                    setNotification(null)
                }, n.duration || 4000)
                return () => clearTimeout(timer)
            }
        })
    }, [])

    if (!notification) return null

    const styles = {
        success: {
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-500',
            titleColor: 'text-slate-900',
            accent: 'text-emerald-600',
            icon: CheckCircle2
        },
        error: {
            bg: 'bg-red-50',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-500',
            titleColor: 'text-slate-900',
            accent: 'text-red-500',
            icon: XCircle
        },
        warning: {
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-500',
            titleColor: 'text-slate-900',
            accent: 'text-amber-600',
            icon: AlertTriangle
        },
        info: {
            bg: 'bg-cyan-50',
            iconBg: 'bg-cyan-100',
            iconColor: 'text-cyan-500',
            titleColor: 'text-slate-900',
            accent: 'text-cyan-600',
            icon: Info
        },
        loading: {
            bg: 'bg-slate-50',
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-500',
            titleColor: 'text-slate-900',
            accent: 'text-slate-600',
            icon: Loader2
        }
    }

    const currentStyle = styles[notification.type]
    const Icon = currentStyle.icon

    return (
        <AnimatePresence mode="wait">
            {notification && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => notification.type !== 'loading' && setNotification(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`${currentStyle.bg} p-6 flex justify-center`}>
                            <div className={`w-20 h-20 ${currentStyle.iconBg} rounded-full flex items-center justify-center`}>
                                <Icon className={`w-10 h-10 ${currentStyle.iconColor} ${notification.type === 'loading' ? 'animate-spin' : ''}`} />
                            </div>
                        </div>
                        <div className="p-8 text-center space-y-4">
                            <h3 className={`text-2xl font-black ${currentStyle.titleColor} uppercase tracking-tight`}>
                                {notification.title}
                            </h3>
                            {notification.message && (
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    {typeof notification.message === 'object' && notification.message !== null && !React.isValidElement(notification.message)
                                        ? JSON.stringify(notification.message)
                                        : notification.message}
                                </p>
                            )}

                            <div className="pt-4">
                                {notification.action ? (
                                    <button
                                        onClick={() => {
                                            notification.action?.onClick()
                                            setNotification(null)
                                        }}
                                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                                    >
                                        {notification.action.label}
                                    </button>
                                ) : (
                                    notification.type !== 'loading' && (
                                        <button
                                            onClick={() => setNotification(null)}
                                            className="w-full bg-slate-100 text-slate-900 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                        >
                                            {notification.type === 'success' ? 'Continue' : 'Close'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
