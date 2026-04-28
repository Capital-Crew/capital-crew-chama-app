'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ProcessingOverlayProps {
    isOpen: boolean
    stage: string
}

export function ProcessingOverlay({ isOpen, stage }: ProcessingOverlayProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="processing-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center
                               bg-white/90 backdrop-blur-md p-6"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="bg-white rounded-2xl shadow-2xl border border-slate-100
                                   w-full max-w-sm mx-auto p-8
                                   flex flex-col items-center gap-6"
                    >
                        {/* Spinner */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-400/20 rounded-full
                                            animate-ping scale-150" />
                            <div className="relative bg-blue-600 p-5 rounded-full shadow-xl">
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                            </div>
                        </div>

                        {/* Text */}
                        <div className="text-center space-y-2 w-full">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                Working on it...
                            </h2>
                            <AnimatePresence mode="wait">
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
                            </AnimatePresence>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            {isOpen && (
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2.7, ease: 'linear' }}
                                    className="h-full bg-blue-600 rounded-full"
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
