'use client'

import React from 'react'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'

/**
 * A client-side component that activates the inactivity logout hook.
 * This should be rendered within a protected layout.
 */
export function InactivityHandler({ children }: { children: React.ReactNode }) {
    useInactivityLogout()
    return <>{children}</>
}
