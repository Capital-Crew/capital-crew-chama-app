import { useEffect, useRef, useState, useCallback } from 'react'
import { UseFormWatch } from 'react-hook-form'
import { useDebounce } from '@/hooks/useDebounce'
import { saveLoanDraft } from '@/app/loan-draft-actions'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseFormAutoSaveOptions {
    watch: UseFormWatch<any>
    debounceMs?: number
    enabled?: boolean
    loanType?: string
    step?: number
}

/**
 * Enhanced auto-save hook with loan-specific tracking
 * 
 * @param watch - React Hook Form watch function
 * @param debounceMs - Debounce delay in milliseconds
 * @param enabled - Whether auto-save is enabled
 * @param loanType - Type of loan being applied for
 * @param step - Current step in multi-step form
 */
export function useFormAutoSave({
    watch,
    debounceMs = 1000,
    enabled = true,
    loanType,
    step = 1
}: UseFormAutoSaveOptions) {
    const [status, setStatus] = useState<AutoSaveStatus>('idle')
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Watch all form values
    const formData = watch()

    // Debounce the form data
    const debouncedFormData = useDebounce(formData, debounceMs)

    // Track if this is the first render (don't save on mount)
    const isFirstRender = useRef(true)

    // Track the latest form data for unmount save
    const latestFormDataRef = useRef(formData)
    const latestLoanTypeRef = useRef(loanType)
    const latestStepRef = useRef(step)

    // Update refs on every render
    useEffect(() => {
        latestFormDataRef.current = formData
        latestLoanTypeRef.current = loanType
        latestStepRef.current = step
    }, [formData, loanType, step])

    // Save function
    const save = useCallback(async (data: any, currentLoanType?: string, currentStep?: number) => {
        if (!enabled) return

        setStatus('saving')
        setError(null)

        try {
            const result = await saveLoanDraft({
                formData: data,
                loanType: currentLoanType,
                step: currentStep
            })

            if (result.error) {
                setStatus('error')
                setError(result.error)
            } else {
                setStatus('saved')
                setLastSaved(new Date())

                // Reset to idle after 2 seconds
                setTimeout(() => {
                    setStatus('idle')
                }, 2000)
            }
        } catch (err: any) {
            setStatus('error')
            setError(err.message || 'Failed to save')
        }
    }, [enabled])

    // Auto-save when debounced data changes
    useEffect(() => {
        // Skip first render
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!enabled) return

        // Only save if we have meaningful data
        const hasData = Object.keys(debouncedFormData).some(key => {
            const value = debouncedFormData[key]
            return value !== '' && value !== null && value !== undefined
        })

        if (hasData) {
            save(debouncedFormData, loanType, step)
        }
    }, [debouncedFormData, enabled, save, loanType, step])

    // Unmount protection - save on component unmount
    useEffect(() => {
        return () => {
            // Use navigator.sendBeacon for reliable unmount save
            const data = latestFormDataRef.current
            const currentLoanType = latestLoanTypeRef.current
            const currentStep = latestStepRef.current

            const hasData = Object.keys(data).some(key => {
                const value = data[key]
                return value !== '' && value !== null && value !== undefined
            })

            if (hasData && enabled) {
                // Try sendBeacon first (most reliable)
                if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                    const payload = {
                        formData: data,
                        loanType: currentLoanType,
                        step: currentStep
                    }
                    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
                    navigator.sendBeacon('/api/loan-draft/save', blob)
                } else {
                    // Fallback to synchronous save (less reliable)
                    saveLoanDraft({
                        formData: data,
                        loanType: currentLoanType,
                        step: currentStep
                    }).catch(console.error)
                }
            }
        }
    }, [enabled])

    return {
        status,
        lastSaved,
        error,
        save: () => save(formData, loanType, step) // Manual save function
    }
}
