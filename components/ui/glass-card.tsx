'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { scaleIn } from '@/lib/animation-variants'

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode
    className?: string
    gradient?: boolean
}

export function GlassCard({ children, className, gradient = false, ...props }: GlassCardProps) {
    return (
        <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
                "rounded-2xl border border-white/20 backdrop-blur-md shadow-xl overflow-hidden",
                gradient
                    ? "bg-gradient-to-br from-white/10 to-white/5"
                    : "bg-white/10",
                className
            )}
            {...props}
        >
            {/* Optional subtle noise texture overlay could go here */}
            {children}
        </motion.div>
    )
}
