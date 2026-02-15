'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    label?: string;
    className?: string;
    fallbackRoute?: string;
}

export function BackButton({ label = 'Back', className = '', fallbackRoute = '/loans' }: BackButtonProps) {
    const router = useRouter()

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push(fallbackRoute)
        }
    }

    return (
        <button
            onClick={handleBack}
            className={`text-sm text-slate-500 hover:text-teal-600 mb-1 flex items-center gap-1 transition-colors group ${className}`}
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {label}
        </button>
    )
}
