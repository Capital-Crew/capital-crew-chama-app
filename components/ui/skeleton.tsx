'use client'

import { HTMLMotionProps, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLMotionProps<"div"> {
    className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <motion.div
            className={cn("rounded-md bg-slate-100 dark:bg-slate-800", className)}
            animate={{
                opacity: [0.5, 1, 0.5],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            {...props}
        />
    )
}
