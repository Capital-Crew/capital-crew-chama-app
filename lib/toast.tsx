import { notificationStore } from "@/lib/notification-store"
import React from 'react'

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading"

interface ToastOptions {
    title: string
    description?: React.ReactNode
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

/**
 * Show a toast notification (now Global Modal)
 */
export function showToast(variant: ToastVariant, options: ToastOptions) {
    const { title, description, duration, action } = options

    notificationStore.emit({
        type: variant,
        title,
        message: description,
        action,
        duration: duration
    })
}

/**
 * Convenience functions for common toast types
 */
export const toast = {
    success: (title: string, description?: string, options?: Partial<ToastOptions>) => {
        return showToast("success", { title, description, ...options })
    },

    error: (title: string, description?: string, options?: Partial<ToastOptions>) => {
        return showToast("error", { title, description, ...options })
    },

    warning: (title: string, description?: string, options?: Partial<ToastOptions>) => {
        return showToast("warning", { title, description, ...options })
    },

    info: (title: string, description?: string, options?: Partial<ToastOptions>) => {
        return showToast("info", { title, description, ...options })
    },

    loading: (title: string, description?: string) => {
        return showToast("loading", { title, description })
    },

    dismiss: (toastId?: string | number) => {
        notificationStore.dismiss()
    },

    promise: <T,>(
        promise: Promise<T>,
        {
            loading,
            success,
            error,
        }: {
            loading: string
            success: string | ((data: T) => string)
            error: string | ((error: any) => string)
        }
    ) => {
        notificationStore.emit({ type: "loading", title: loading, duration: Infinity })

        promise
            .then((data) => {
                const successMessage = typeof success === 'function' ? success(data) : success
                notificationStore.emit({
                    type: "success",
                    title: "Success",
                    message: successMessage,
                    duration: 4000
                })
            })
            .catch((err) => {
                const errorMessage = typeof error === 'function' ? error(err) : error
                notificationStore.emit({
                    type: "error",
                    title: "Error",
                    message: errorMessage,
                    duration: 4000
                })
            })

        return promise
    },
}

/**
 * Example Usage:
 * 
 * ```tsx
 * import { toast } from '@/lib/toast'
 * 
 * // Simple success
 * toast.success("Payment processed", "Your transaction was successful")
 * 
 * // Error with action
 * toast.error("Transaction blocked", "Insufficient funds", {
 *   action: {
 *     label: "Add Funds",
 *     onClick: () => router.push('/wallet')
 *   }
 * })
 * 
 * // Promise-based
 * toast.promise(
 *   submitLoan(),
 *   {
 *     loading: "Processing loan application...",
 *     success: "Loan application submitted!",
 *     error: "Failed to submit loan application"
 *   }
 * )
 * ```
 */
