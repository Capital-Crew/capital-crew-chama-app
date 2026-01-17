'use client'

import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animation-variants'

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="w-full"
        >
            {children}
        </motion.div>
    )
}
