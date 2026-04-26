'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ProcessingOverlayProps {
    isOpen: boolean
    title?: string
    stage?: string
    progressDuration?: number
}

/**
 * Premium Blocking Loader Dialog
 * 
 * Provides a high-fidelity 'Working on it...' card overlay that blocks
 * all user interaction during sensitive state transitions.
 */
export function ProcessingOverlay({
    isOpen,
    title = "Working on it...",
    stage,
    progressDuration = 2.7
}: ProcessingOverlayProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="global-processing-overlay"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md p-6 pointer-events-none"
                >
                    {/* ── Blocking Loader Dialog Card ── */}
                    <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm mx-auto p-8 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                        
                        {/* Spinner */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping scale-150" />
                            <div className="relative bg-blue-600 p-5 rounded-full shadow-2xl">
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center space-y-2 w-full">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                {title}
                            </h2>
                            <AnimatePresence mode="wait">
                                {stage && (
                                    <motion.p
                                        key={stage}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-sm text-slate-500 font-medium leading-relaxed"
                                    >
                                        {stage}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: progressDuration, ease: "linear" }}
                                className="h-full bg-blue-600 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
