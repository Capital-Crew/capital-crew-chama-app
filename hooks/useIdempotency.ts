'use client';

import { useRef, useCallback } from 'react';

/**
 * React hook for managing idempotency keys
 * 
 * Generates a unique UUID on mount and persists it across re-renders.
 * Provides a function to refresh the key when needed (e.g., after form submission).
 * 
 * @returns Object containing the idempotency key and refresh function
 * 
 * @example
 * ```typescript
 * function MyForm() {
 *   const { idempotencyKey, refreshKey } = useIdempotency();
 * 
 *   const handleSubmit = async () => {
 *     await submitFormAction(formData, idempotencyKey);
 *     refreshKey(); // Generate new key for next submission
 *   };
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useIdempotency() {
    // Generate UUID only once on mount
    const keyRef = useRef<string>(
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : generateFallbackUUID()
    );

    /**
     * Generate a new idempotency key
     * Call this after a successful submission to prepare for the next one
     */
    const refreshKey = useCallback(() => {
        keyRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : generateFallbackUUID();
    }, []);

    return {
        idempotencyKey: keyRef.current,
        refreshKey
    };
}

/**
 * Fallback UUID generator for environments without crypto.randomUUID
 * (e.g., older browsers or Node.js versions)
 */
function generateFallbackUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
