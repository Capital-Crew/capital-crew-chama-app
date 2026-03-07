'use client'

import { useEffect, useRef, useCallback } from 'react'
import { handleSignOut } from '@/app/auth-actions'

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Hook to automatically log out users after a period of inactivity.
 * Listens for physical events (mouse move, key press, etc.) to reset the timer.
 */
export function useInactivityLogout(timeoutMs: number = INACTIVITY_TIMEOUT) {
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(async () => {
            await handleSignOut()
        }, timeoutMs)
    }, [timeoutMs])

    useEffect(() => {
        // Events that indicate user activity
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
            'wheel'
        ]

        // Initial timer setup
        resetTimer()

        // Handle activity
        const handleActivity = () => {
            resetTimer()
        }

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true })
        })

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [resetTimer])
}
