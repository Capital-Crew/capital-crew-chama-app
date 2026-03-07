'use client';

import { useRef, useCallback } from 'react';

/**
 * React hook for managing idempotency keys
 * 
 * Generates a unique UUID on mount and persists it across re-renders.
 * Provides a function to refresh the key when needed (e.g., after form submission).
 */
export function useIdempotency() {
    // Generate UUID only once on mount
    const keyRef = useRef<string>(crypto.randomUUID());

    /**
     * Generate a new idempotency key
     * Call this after a successful submission to prepare for the next one
     */
    const refreshKey = useCallback(() => {
        keyRef.current = crypto.randomUUID();
    }, []);

    return {
        idempotencyKey: keyRef.current,
        refreshKey
    };
}
