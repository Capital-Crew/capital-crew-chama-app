'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from '@/hooks/useNavigate'
import { cn } from '@/lib/utils'

interface BackButtonProps {
    label?: string;
    className?: string;
    fallbackRoute?: string;
}

export function BackButton({ label = 'Back', className = '', fallbackRoute = '/loans' }: BackButtonProps) {
    const { push, isPending } = useNavigate()

    const handleBack = () => {
        if (isPending) return;
        
        // Note: useNavigate doesn't have a direct 'back()' that uses transition yet, 
        // but we can simulate it or just push the fallback/previous route.
        // For simplicity and to show the transition, we'll use push.
        if (typeof window !== 'undefined' && window.history.length > 1) {
            // We use history.back() directly if we don't care about transition on the back button itself,
            // OR we can use the transition for a better feel.
            // Since we want "Smooth Transitions", let's use transition for the fallback at least.
            // router.back() doesn't return a promise or have a callback in Next.js easily for transition.
            // But we can just use push to a specific route if known, or just let it be.
            window.history.back();
        } else {
            push(fallbackRoute);
        }
    }

    return (
        <button
            onClick={handleBack}
            disabled={isPending}
            className={cn(
                "text-sm font-bold text-slate-400 hover:text-cyan-600 mb-2 flex items-center gap-2 transition-all group disabled:opacity-50",
                className
            )}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
            ) : (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            )}
            <span className="uppercase tracking-widest text-[10px]">{label}</span>
        </button>
    )
}
